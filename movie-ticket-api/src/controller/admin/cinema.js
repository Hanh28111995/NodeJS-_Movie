import { sendSuccess } from "../../helper/client.js";
import Cinema from "../../model/cinemaModel.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getAllCinemas = asyncHandler(async (req, res) => {
  const cinemas = await Cinema.find();
  return sendSuccess(res, "Lấy danh sách rạp phim thành công", cinemas);
});

export const addCinema = asyncHandler(async (req, res) => {
  const newCinema = await Cinema.create(req.body);
  return sendSuccess(res, "Thêm rạp phim thành công", newCinema);
});

export const updateCinema = asyncHandler(async (req, res) => {
  const { cinemaId } = req.body;
  const updatedCinema = await Cinema.findByIdAndUpdate(cinemaId, req.body, {
    new: true,
  });
  return sendSuccess(res, "Cập nhật rạp phim thành công", updatedCinema);
});

export const deleteCinema = asyncHandler(async (req, res) => {
  const { cinemaId } = req.params;
  await Cinema.findByIdAndDelete(cinemaId);
  return sendSuccess(res, "Xóa rạp phim thành công");
});


