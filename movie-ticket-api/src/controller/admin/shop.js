import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import Shop from "../../model/shopModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import { uploadToFirebase, deleteFromFirebase } from "../../helper/firebaseStorage.js";

export const getAllShops = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [shops, total] = await Promise.all([
    Shop.find().sort({ title: 1 }).skip(skip).limit(limit).lean(),
    Shop.countDocuments(),
  ]);

  return sendSuccess(res, "All shop products retrieved successfully", {
    shops,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const addShop = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, "Banner image is required");

  const { publicUrl: bannerUrl } = await uploadToFirebase(req.file, "shopProducts");
  const newShop = await Shop.create({ ...req.body, banner: bannerUrl });
  return sendSuccess(res, "Shop product added successfully", newShop);
});

export const updateShop = asyncHandler(async (req, res) => {
  const { shopid } = req.params;
  const shop = await Shop.findOne({ id_shop: shopid });
  if (!shop) return sendError(res, "Shop product not found");

  const updateData = { ...req.body };

  if (req.file) {
    const { publicUrl } = await uploadToFirebase(req.file, "shopProducts");
    updateData.banner = publicUrl;
  }

  const updatedShop = await Shop.findOneAndUpdate({ id_shop: shopid }, updateData, { new: true });

  if (req.file && shop.banner) {
    await deleteFromFirebase(shop.banner);
  }

  return sendSuccess(res, "Shop product updated successfully", updatedShop);
});

export const deleteShop = asyncHandler(async (req, res) => {
  const { shopid } = req.params;
  const shop = await Shop.findOne({ id_shop: shopid });
  if (!shop) return sendError(res, "Shop product not found");

  if (shop.banner) {
    await deleteFromFirebase(shop.banner);
  }

  await Shop.findOneAndDelete({ id_shop: shopid });
  return sendSuccess(res, "Shop product deleted successfully");
});
