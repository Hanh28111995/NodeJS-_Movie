import { sendSuccess } from "../../helper/client.js";
import Theater from "../../model/theaterModel.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getAllTheaters = asyncHandler(async (req, res) => {
  const theaters = await Theater.find().populate("cinema");
  return sendSuccess(res, "Lấy danh sách phòng chiếu thành công", theaters);
});

export const addTheater = asyncHandler(async (req, res) => {
  const newTheater = await Theater.create(req.body);
  return sendSuccess(res, "Thêm phòng chiếu thành công", newTheater);
});

export const updateTheater = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedTheater = await Theater.findByIdAndUpdate(id, req.body, { new: true });
  return sendSuccess(res, "Cập nhật phòng chiếu thành công", updatedTheater);
});

export const deleteTheater = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Theater.findByIdAndDelete(id);
  return sendSuccess(res, "Xóa phòng chiếu thành công");
});
