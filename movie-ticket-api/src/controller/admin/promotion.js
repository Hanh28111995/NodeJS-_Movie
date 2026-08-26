import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import promotionService from "../../service/admin/promotionService.js";

export const getAllPromotions = asyncHandler(async (req, res) => {
  const result = await promotionService.getAllPromotions(req.query);
  return sendSuccess(res, "All promotions retrieved successfully", result);
});

export const getPromotionDetail = asyncHandler(async (req, res) => {
  try {
    const { promotionid } = req.params;
    const promotion = await promotionService.getPromotionById(promotionid);
    return sendSuccess(res, "Promotion retrieved successfully", promotion);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});

export const addPromotion = asyncHandler(async (req, res) => {
  try {
    const newPromotion = await promotionService.addPromotion(
      req.body,
      req.file,
    );
    return sendSuccess(res, "Promotion added successfully", newPromotion);
  } catch (error) {
    if (error.statusCode === 400) {
      return sendError(res, error.message, 400);
    }
    throw error;
  }
});

export const updatePromotion = asyncHandler(async (req, res) => {
  try {
    const { promotionid } = req.params;
    const updatedPromotion = await promotionService.updatePromotion(
      promotionid,
      req.body,
      req.file,
    );
    return sendSuccess(res, "Promotion updated successfully", updatedPromotion);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});

export const deletePromotion = asyncHandler(async (req, res) => {
  try {
    const { promotionid } = req.params;
    await promotionService.deletePromotion(promotionid);
    return sendSuccess(res, "Promotion deleted successfully");
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});
