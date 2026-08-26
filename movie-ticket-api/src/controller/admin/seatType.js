import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import seatTypeService from "../../service/admin/seatTypeService.js";

export const getSeatType = asyncHandler(async (req, res) => {
  const result = await seatTypeService.getAllSeatTypes();
  return sendSuccess(res, "All seat types retrieved successfully", result);
});

export const addSeatType = asyncHandler(async (req, res) => {
  const newSeatType = await seatTypeService.addSeatType(req.body);
  return sendSuccess(res, "SeatType added successfully", newSeatType);
});

export const updateSeatType = asyncHandler(async (req, res) => {
  const updatedSeatType = await seatTypeService.updateSeatType(req.body);
  return sendSuccess(res, "SeatType updated successfully", updatedSeatType);
});

export const deleteSeatType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await seatTypeService.deleteSeatType(id);
  return sendSuccess(res, "SeatType deleted successfully");
});