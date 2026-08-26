
import { submitNewPromotion } from "../../validation/index.js";
import {
  uploadToFirebase,
  deleteFromFirebase,
} from "../../helper/firebaseStorage.js";
import redisClient from "../../config/Redis.js";
import promotionRepository from "../../repository/promotionRepository.js";

class PromotionService {
  async getAllPromotions(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const filters = {};

    const [promotions, total] = await Promise.all([
      promotionRepository.findAll(filters, { skip, limit }),
      promotionRepository.countDocuments(filters),
    ]);

    return {
      promotions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPromotionById(promotionid) {
    const promotion = await promotionRepository.findById(promotionid);
    if (!promotion) {
      const error = new Error("Promotion not found");
      error.statusCode = 404;
      throw error;
    }
    return promotion;
  }

  async addPromotion(bodyData, file) {
    if (!file) {
      const error = new Error("Banner image is required");
      error.statusCode = 400;
      throw error;
    }

    // Tạm gắn banner vào bodyData để qua bước validate submitNewPromotion
    const { publicUrl: bannerUrl } = await uploadToFirebase(file, "promotions");
    const fullData = { ...bodyData, banner: bannerUrl };

    const validate = submitNewPromotion(fullData);
    if (validate) {
      // Nếu validate thất bại, xóa file vừa upload lên Firebase để tránh rác
      await deleteFromFirebase(bannerUrl).catch(() => {});
      const error = new Error("Invalid input data");
      error.statusCode = 400;
      throw error;
    }

    const newPromotion = await promotionRepository.create(fullData);

    await redisClient.del("cache:promotions").catch(console.error);

    return newPromotion;
  }

  async updatePromotion(promotionid, bodyData, file) {
    const promotion = await promotionRepository.findOne({ _id: promotionid });
    if (!promotion) {
      const error = new Error("Promotion not found");
      error.statusCode = 404;
      throw error;
    }

    const updateData = { ...bodyData };

    if (file) {
      const { publicUrl } = await uploadToFirebase(file, "promotions");
      updateData.banner = publicUrl;
    }

    const updatedPromotion = await promotionRepository.updateById(
      promotionid,
      updateData,
    );

    if (file && promotion.banner) {
      await deleteFromFirebase(promotion.banner);
    }

    await redisClient.del("cache:promotions").catch(console.error);

    return updatedPromotion;
  }

  async deletePromotion(promotionid) {
    const promotion = await promotionRepository.findOne({ _id: promotionid });
    if (!promotion) {
      const error = new Error("Promotion not found");
      error.statusCode = 404;
      throw error;
    }

    if (promotion.banner) {
      await deleteFromFirebase(promotion.banner);
    }

    await promotionRepository.deleteById(promotionid);

    await redisClient.del("cache:promotions").catch(console.error);
  }
}

export default new PromotionService();
