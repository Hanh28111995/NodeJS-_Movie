import {
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import shopService from "../../service/admin/shopService.js";

export const getAllShops = asyncHandler(async (req, res) => {
  const result = await shopService.getAllShops(req.query);
  return sendSuccess(res, "All shop products retrieved successfully", result);
});

export const getShopProductDetail = asyncHandler(async (req, res) => {
  try {
    const { shopid } = req.params;
    const shop = await shopService.getShopProductDetail(shopid);
    return sendSuccess(res, "Shop product retrieved successfully", shop);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});

export const addShop = asyncHandler(async (req, res) => {
  try {
    const newShop = await shopService.addShop(req.body, req.file);
    return sendSuccess(res, "Shop product added successfully", newShop);
  } catch (error) {
    if (error.statusCode === 400) {
      return sendError(res, error.message, 400);
    }
    throw error;
  }
});

export const updateShop = asyncHandler(async (req, res) => {
  try {
    const { shopid } = req.params;
    const updatedShop = await shopService.updateShop(shopid, req.body, req.file);
    return sendSuccess(res, "Shop product updated successfully", updatedShop);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});

export const deleteShop = asyncHandler(async (req, res) => {
  try {
    const { shopid } = req.params;
    await shopService.deleteShop(shopid);
    return sendSuccess(res, "Shop product deleted successfully");
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});