import shopRepository from "../../repository/shopRepository.js";
import { submitNewShopProduct } from "../../validation/index.js";
import {
  uploadToFirebase,
  deleteFromFirebase,
} from "../../helper/firebaseStorage.js";

// helper: chuẩn hóa stockByBranch từ payload (JSON string hoặc mảng) thành object cho Map
const normalizeStockByBranch = (raw) => {
  if (raw === undefined || raw === null || raw === "") return undefined;
  let list = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(list)) return undefined;
  const map = {};
  for (const item of list) {
    const branch = item?.branch?.trim();
    if (branch) map[branch] = Math.max(0, Number(item.quantity) || 0);
  }
  return map;
};

class ShopService {
  async getAllShops(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    const filters = {};

    const [shops, total] = await Promise.all([
      shopRepository.findAll(filters, { skip, limit }),
      shopRepository.countDocuments(filters),
    ]);

    return {
      shops,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getShopProductDetail(shopid) {
    const shop = await shopRepository.findById(shopid);
    if (!shop) {
      const error = new Error("Shop product not found");
      error.statusCode = 404;
      throw error;
    }
    return shop;
  }

  async addShop(bodyData, file) {
    if (!file) {
      const error = new Error("Banner image is required");
      error.statusCode = 400;
      throw error;
    }

    const { publicUrl: bannerUrl } = await uploadToFirebase(
      file,
      "shopProducts",
    );
    const fullData = { ...bodyData, banner: bannerUrl };
    const stockMap = normalizeStockByBranch(bodyData.stockByBranch);
    if (stockMap !== undefined) fullData.stockByBranch = stockMap;
    const validate = submitNewShopProduct(fullData);
    if (validate) {
      await deleteFromFirebase(bannerUrl).catch(() => {});
      const error = new Error("Invalid input data");
      error.statusCode = 400;
      throw error;
    }

    const newShop = await shopRepository.create(fullData);
    return newShop;
  }

  async updateShop(shopid, bodyData, file) {
    const shop = await shopRepository.findOne({ id_shop: shopid });
    if (!shop) {
      const error = new Error("Shop product not found");
      error.statusCode = 404;
      throw error;
    }

    const updateData = { ...bodyData };
    delete updateData.stockByBranch;
    const stockMap = normalizeStockByBranch(bodyData.stockByBranch);
    if (stockMap !== undefined) updateData.stockByBranch = stockMap;

    if (file) {
      const { publicUrl } = await uploadToFirebase(file, "shopProducts");
      updateData.banner = publicUrl;
    }

    const updatedShop = await shopRepository.updateOne(
      { id_shop: shopid },
      updateData,
    );

    if (file && shop.banner) {
      await deleteFromFirebase(shop.banner);
    }

    return updatedShop;
  }

  async deleteShop(shopid) {
    const shop = await shopRepository.findOne({ id_shop: shopid });
    if (!shop) {
      const error = new Error("Shop product not found");
      error.statusCode = 404;
      throw error;
    }

    if (shop.banner) {
      await deleteFromFirebase(shop.banner);
    }

    await shopRepository.deleteOne({ id_shop: shopid });
  }
}

export default new ShopService();
