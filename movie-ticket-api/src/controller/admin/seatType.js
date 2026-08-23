import { sendError, sendServerError, sendSuccess } from "../../helper/client.js";
import SeatType from "../../model/seatTypeModel.js";
import { submitSeatType } from "../../validation/index.js";
import asyncHandler from "../../util/asyncHandler.js";
import redisClient from "../../config/Redis.js"; // 1. Import redisClient

export const getSeatType = asyncHandler(async (req, res) => {
  const seatTypes = await SeatType.find().lean();
  return sendSuccess(res, "All seat types retrieved successfully", { seatTypes });
});

export const addSeatType = async (req, res) => {
  try {
    const validate = submitSeatType(req.body);
    if (validate)
      return sendError(res, "required fields are missing or invalid");
    const newSeatType = await SeatType.create(req.body);

    // 2. Xóa cache loại ghế ngay lập tức khi thêm mới
    await redisClient.del("cache:seatTypes").catch(console.error);

    return sendSuccess(res, "SeatType added successfully", newSeatType);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const updateSeatType = async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    if (!_id) return sendError(res, "Thiếu _id", 400);
    const updatedSeatType = await SeatType.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updatedSeatType) return sendError(res, "SeatType not found");

    // 3. Xóa cache loại ghế ngay lập tức khi cập nhật
    await redisClient.del("cache:seatTypes").catch(console.error);

    return sendSuccess(res, "SeatType updated successfully", updatedSeatType);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const deleteSeatType = async (req, res) => {
  try {
    const { id } = req.params;
    const newSeatType = await SeatType.findById(id);
    if (!newSeatType) {
      return sendError(res, "SeatType not found");
    }
    const deletedSeatType = await SeatType.findByIdAndDelete(id);

    // 4. Xóa cache loại ghế ngay lập tức khi xóa
    await redisClient.del("cache:seatTypes").catch(console.error);

    return sendSuccess(res, "Movie deleted successfully");
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};