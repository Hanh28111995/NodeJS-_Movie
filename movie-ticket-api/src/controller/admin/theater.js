import { sendSuccess, sendError } from "../../helper/client.js";
import Theater from "../../model/theaterModel.js";
import { generateSeats } from "../../helper/generateSeats.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getAllTheaters = asyncHandler(async (req, res) => {
  const theaters = await Theater.find().populate("cinema").lean();
  return sendSuccess(res, "Lấy danh sách phòng chiếu thành công", { theaters });
});

export const getTheaterById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const theater = await Theater.findById(id).populate("cinema").populate("seats.seatType");
  if (!theater) return sendError(res, "Không tìm thấy phòng chiếu", 404);
  return sendSuccess(res, "Lấy thông tin phòng chiếu thành công", { theater });
});

export const addTheater = asyncHandler(async (req, res) => {
  const { totalSeat } = req.body;
  
  // Tự động tạo danh sách ghế nếu có thông số rows và cols
  if (totalSeat && totalSeat.rows && totalSeat.cols) {
    req.body.seats = await generateSeats(totalSeat.rows, totalSeat.cols);
  }

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
