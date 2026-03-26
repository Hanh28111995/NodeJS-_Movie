import { sendSuccess, sendError } from "../../helper/client.js";
import Showtime from "../../model/showtimeModel.js";
import Movie from "../../model/movieModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import * as cronService from "../../service/cronService.js";
import { createOneShowtime } from "../../service/showtimeService.js";

// CREATE
export const createShowtime = asyncHandler(async (req, res) => {
  const { theater: theaterId, id_movie: movieId, startTime } = req.body;
  try {
    const showtime = await createOneShowtime({ theaterId, movieId, startTime });
    return sendSuccess(res, "Tạo suất chiếu mới thành công", showtime);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

// GET ALL
export const getAllShowtimes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [showtimes, total] = await Promise.all([
    Showtime.find()
      .populate("cinema")
      .populate("theater")
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Showtime.countDocuments(),
  ]);

  const movieIds = [...new Set(showtimes.map((st) => st.id_movie?.toString()).filter(Boolean))];
  const movies = await Movie.find({ _id: { $in: movieIds } }).select("_id title").lean();
  const movieMap = Object.fromEntries(movies.map((m) => [m._id.toString(), m]));

  const result = showtimes.map((st) => ({
    ...st,
    id_movie: movieMap[st.id_movie?.toString()] || st.id_movie,
  }));

  return sendSuccess(res, "All showtimes retrieved successfully", {
    showtimes: result,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// GET ONE
export const getShowtimeById = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id)
    .populate("cinema")
    .populate("theater")
    .lean();

  if (!showtime)
    return sendSuccess(res, "Showtime retrieved successfully", { showtime: null });

  const movie = await Movie.findById(showtime.id_movie).select("_id title").lean();

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
    showtime: { ...updatedShowtime, id_movie: movie || updatedShowtime.id_movie },
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

// GET UPCOMING - lịch chiếu sắp tới (startTime > now theo giờ VN)
export const getUpcomingShowtimes = asyncHandler(async (req, res) => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gt: now } })
    .select("_id startTime theater id_movie")
    .sort({ startTime: 1 })
    .lean();
  return sendSuccess(res, "Upcoming showtimes retrieved successfully", { showtimes });
});

// GET TODAY - lịch chiếu trong ngày hôm nay theo giờ VN (UTC+7)
export const getShowtimesToday = asyncHandler(async (req, res) => {
  const VN_OFFSET = 7 * 60 * 60 * 1000; // 7 tiếng tính bằng ms
  const nowVN = new Date(Date.now() + VN_OFFSET);

  // Tính startOfDay và endOfDay theo giờ VN, rồi convert ngược về UTC để query
  const startOfDayVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));
  const endOfDayVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate() + 1));

  // Trừ offset để ra UTC tương ứng
  const startUTC = new Date(startOfDayVN.getTime() - VN_OFFSET);
  const endUTC = new Date(endOfDayVN.getTime() - VN_OFFSET);

  const showtimes = await Showtime.find({
    startTime: { $gte: startUTC, $lt: endUTC },
  })
    .select("_id startTime theater id_movie")
    .sort({ startTime: 1 })
    .lean();
  return sendSuccess(res, "Today's showtimes retrieved successfully", { showtimes });
});
