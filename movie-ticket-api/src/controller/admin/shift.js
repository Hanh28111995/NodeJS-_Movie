import { sendError, sendSuccess } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import shiftService from "../../service/admin/shiftService.js";

const handleShiftError = (res, error) => {
  if (error.statusCode) return sendError(res, error.message, error.statusCode);
  throw error;
};

export const getAllShifts = asyncHandler(async (req, res) => {
  try {
    const shifts = await shiftService.getAllShifts(req.query);
    return sendSuccess(res, "Lấy danh sách ca làm thành công", shifts);
  } catch (error) {
    return handleShiftError(res, error);
  }
});

export const getShiftById = asyncHandler(async (req, res) => {
  try {
    const shift = await shiftService.getShiftByID(req.params.shiftID);
    return sendSuccess(res, "Lấy thông tin ca làm thành công", shift);
  } catch (error) {
    return handleShiftError(res, error);
  }
});

export const createShift = asyncHandler(async (req, res) => {
  try {
    const shift = await shiftService.createShift(req.body);
    return sendSuccess(res, "Tạo ca làm thành công", shift);
  } catch (error) {
    return handleShiftError(res, error);
  }
});

export const updateShift = asyncHandler(async (req, res) => {
  try {
    const shift = await shiftService.updateShift(req.params.shiftID, req.body);
    return sendSuccess(res, "Cập nhật ca làm thành công", shift);
  } catch (error) {
    return handleShiftError(res, error);
  }
});

export const deleteShift = asyncHandler(async (req, res) => {
  try {
    const shift = await shiftService.deleteShift(req.params.shiftID);
    return sendSuccess(res, "Xóa ca làm thành công", shift);
  } catch (error) {
    return handleShiftError(res, error);
  }
});
