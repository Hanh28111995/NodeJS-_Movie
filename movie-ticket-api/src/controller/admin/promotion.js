import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import Promotion from "../../model/promotionModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import { uploadToFirebase, deleteFromFirebase } from "../../helper/firebaseStorage.js";

export const getAllPromotions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [promotions, total] = await Promise.all([
    Promotion.find().sort({ title: 1 }).skip(skip).limit(limit).lean(),
    Promotion.countDocuments(),
  ]);

  return sendSuccess(res, "All promotions retrieved successfully", {
    promotions,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const getPromotionDetail = asyncHandler(async (req, res) => {
  const { promotionid } = req.params;
  const promotion = await Promotion.findById(promotionid).lean();
  if (!promotion) return sendError(res, "Promotion not found", 404);
  return sendSuccess(res, "Promotion retrieved successfully", promotion);
});

export const addPromotion = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, "Banner image is required");

  const { publicUrl: bannerUrl } = await uploadToFirebase(req.file, "promotions");
  const newPromotion = await Promotion.create({ ...req.body, banner: bannerUrl });
  return sendSuccess(res, "Promotion added successfully", newPromotion);
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const { promotionid } = req.params;
  const promotion = await Promotion.findOne({ _id: promotionid });
  if (!promotion) return sendError(res, "Promotion not found");

  const updateData = { ...req.body };

  if (req.file) {
    const { publicUrl } = await uploadToFirebase(req.file, "promotions");
    updateData.banner = publicUrl;
  }

  const updatedPromotion = await Promotion.findOneAndUpdate(
    { _id: promotionid },
    updateData,
    { new: true },
  );

  if (req.file && promotion.banner) {
    await deleteFromFirebase(promotion.banner);
  }

  return sendSuccess(res, "Promotion updated successfully", updatedPromotion);
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const { promotionid } = req.params;
  const promotion = await Promotion.findOne({ _id: promotionid });
  if (!promotion) return sendError(res, "Promotion not found");

  if (promotion.banner) {
    await deleteFromFirebase(promotion.banner);
  }

  await Promotion.findOneAndDelete({ _id: promotionid });
  return sendSuccess(res, "Promotion deleted successfully");
});
