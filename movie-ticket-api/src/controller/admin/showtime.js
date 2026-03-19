import { sendSuccess, sendError } from "../../helper/client.js";
import Showtime from "../../model/showtimeModel.js";
import Movie from "../../model/movieModel.js";
import Theater from "../../model/theaterModel.js";
import Cinema from "../../model/cinemaModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import * as cronService from "../../service/cronService.js";

// CREATE
export const createShowtime = asyncHandler(async (req, res) => {
  const { theater: theaterId, id_movie: movieId, startTime } = req.body;

  const theater = await Theater.findById(theaterId).lean();
  if (!theater) return sendError(res, "Không tìm thấy phòng chiếu", 404);

  // Tìm cinema theo cinemaName trong theater
  const cinema = await Cinema.findOne({ cinemaName: theater.cinemaName }).lean();
  if (!cinema) return sendError(res, "Không tìm thấy cụm rạp có phòng chiếu này", 400);
  const cinemaId = cinema._id;

  // 2. Kiểm tra trùng lịch (Logic cơ bản: cùng phòng, cùng giờ)
  const isExisted = await Showtime.findOne({
    theater: theaterId,
    startTime: startTime,
  });
  if (isExisted)
    return sendError(
      res,
      "Khung giờ này tại phòng chiếu đã có suất chiếu khác",
      400,
    );

  // 3. Clone danh sách ghế từ Theater sang Showtime
  // Đảm bảo theater.seats có dữ liệu
  if (!theater.seats || theater.seats.length === 0) {
    return sendError(res, "Phòng chiếu chưa có cấu hình ghế mặc định", 400);
  }

  const seats = theater.seats.map((s) => ({
    seatNumber: s.seatNumber,
    seatType: s.seatType,
    isBooked: false, // Tất cả ghế mới đều chưa đặt
  }));

  // 4. Tạo suất chiếu
  const showtime = await Showtime.create({
    id_movie: movieId,
    theater: theaterId,
    cinema: cinemaId,
    startTime,
    seats,
  });

  return sendSuccess(res, "Tạo suất chiếu mới thành công", showtime);
});

// GET ALL
export const getAllShowtimes = asyncHandler(async (req, res) => {
  const showtimes = await Showtime.find()
    .populate("cinema")
    .populate("theater")
    .lean();

  const movieIds = [
    ...new Set(showtimes.map((st) => st.id_movie?.toString()).filter(Boolean)),
  ];
  const movies = await Movie.find({ _id: { $in: movieIds } })
    .select("_id title")
    .lean();
  const movieMap = Object.fromEntries(movies.map((m) => [m._id.toString(), m]));

  const result = showtimes.map((st) => ({
    ...st,
    id_movie: movieMap[st.id_movie?.toString()] || st.id_movie,
  }));

  return sendSuccess(res, "All showtimes retrieved successfully", result);
});

// GET ONE
export const getShowtimeById = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id)
    .populate("cinema")
    .populate("theater")
    .lean();

  if (!showtime)
    return sendSuccess(res, "Showtime retrieved successfully", showtime);

  const movie = await Movie.findById(showtime.id_movie)
    .select("_id title")
    .lean();

  await cronService.cleanupExpiredTicketsByShowtime(
    showtime.id_movie?.toString(),
    showtime.theater._id.toString(),
    showtime.startTime,
  );

  const updatedShowtime = await Showtime.findById(req.params.id)
    .populate("cinema")
    .populate("theater")
    .lean();

  return sendSuccess(res, "Showtime retrieved successfully", {
    ...updatedShowtime,
    id_movie: movie || updatedShowtime.id_movie,
  });
});

// UPDATE
export const updateShowtime = asyncHandler(async (req, res) => {
  const { id } = req.body;
  const showtime = await Showtime.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  return sendSuccess(res, "Showtime updated successfully", showtime);
});

// DELETE
export const deleteShowtime = asyncHandler(async (req, res) => {
  await Showtime.findByIdAndDelete(req.params.id);
  return sendSuccess(res, "Showtime deleted successfully");
});
