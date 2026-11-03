import { sendError, sendSuccess } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import staffShiftService from "../../service/admin/staffShiftService.js";

const handleStaffShiftError = (res, error) => {
  if (error.statusCode) return sendError(res, error.message, error.statusCode);
  throw error;
};

export const getAllStaffShifts = asyncHandler(async (req, res) => {
  try {
    const assignments = await staffShiftService.getAllStaffShifts(req.query);
    return sendSuccess(res, "Lấy danh sách phân ca thành công", assignments);
  } catch (error) {
    return handleStaffShiftError(res, error);
  }
});

export const getStaffShiftByID = asyncHandler(async (req, res) => {
  try {
    const assignment = await staffShiftService.getStaffShiftByID(
      req.params.staffShiftID,
    );
    return sendSuccess(res, "Lấy thông tin phân ca thành công", assignment);
  } catch (error) {
    return handleStaffShiftError(res, error);
  }
});

export const createStaffShift = asyncHandler(async (req, res) => {
  try {
    const assignment = await staffShiftService.createStaffShift(req.body);
    return sendSuccess(res, "Phân ca cho nhân viên thành công", assignment);
  } catch (error) {
    return handleStaffShiftError(res, error);
  }
});

export const updateStaffShift = asyncHandler(async (req, res) => {
  try {
    const assignment = await staffShiftService.updateStaffShift(
      req.params.staffShiftID,
      req.body,
    );
    return sendSuccess(res, "Cập nhật phân ca thành công", assignment);
  } catch (error) {
    return handleStaffShiftError(res, error);
  }
});

export const deleteStaffShift = asyncHandler(async (req, res) => {
  try {
    const assignment = await staffShiftService.deleteStaffShift(
      req.params.staffShiftID,
    );
    return sendSuccess(res, "Xóa phân ca thành công", assignment);
  } catch (error) {
    return handleStaffShiftError(res, error);
  }
});
