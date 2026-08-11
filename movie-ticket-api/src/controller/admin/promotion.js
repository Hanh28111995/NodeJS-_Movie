import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import Promotion from "../../model/promotionModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import { bucket } from "../../middleware/firebase.js";
import fs from "fs";

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

export const addPromotion = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, "Banner image is required");

  const localPath = req.file.path;
  const remotePath = `promotions/${Date.now()}_${req.file.originalname}`;
  const fileRef = bucket.file(remotePath);

  await bucket.upload(localPath, {
    destination: remotePath,
    metadata: { contentType: req.file.mimetype },
  });
  await fileRef.makePublic();
  const bannerUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
  fs.unlinkSync(localPath);

  const newPromotion = await Promotion.create({ ...req.body, banner: bannerUrl });
  return sendSuccess(res, "Promotion added successfully", newPromotion);
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const { promotionid } = req.params;
  const promotion = await Promotion.findOne({ _id: promotionid });
  if (!promotion) return sendError(res, "Promotion not found");

  const updateData = { ...req.body };

  if (req.file) {
    const localPath = req.file.path;
    const remotePath = `promotions/${Date.now()}_${req.file.originalname}`;
    const fileRef = bucket.file(remotePath);

    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: { contentType: req.file.mimetype },
    });
    await fileRef.makePublic();
    updateData.banner = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
    fs.unlinkSync(localPath);
  }

  const updatedPromotion = await Promotion.findOneAndUpdate(
    { _id: promotionid },
    updateData,
    { new: true },
  );

  if (req.file && promotion.banner) {
    try {
      const oldRemotePath = promotion.banner.split(`${bucket.name}/`)[1];
      if (oldRemotePath) await bucket.file(oldRemotePath).delete();
    } catch (err) {
      console.log("Failed to delete old banner from Firebase:", err.message);
    }
  }

  return sendSuccess(res, "Promotion updated successfully", updatedPromotion);
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const { promotionid } = req.params;
  const promotion = await Promotion.findOne({ _id: promotionid });
  if (!promotion) return sendError(res, "Promotion not found");

  if (promotion.banner) {
    try {
      const remotePath = promotion.banner.split(`${bucket.name}/`)[1];
      if (remotePath) await bucket.file(remotePath).delete();
    } catch (err) {
      console.log("Failed to delete banner from Firebase:", err.message);
    }
  }

  await Promotion.findOneAndDelete({ _id: promotionid });
  return sendSuccess(res, "Promotion deleted successfully");
});
