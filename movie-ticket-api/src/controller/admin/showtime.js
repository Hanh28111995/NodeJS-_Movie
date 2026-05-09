import { sendSuccess, sendError } from "../../helper/client.js";
import Showtime from "../../model/showtimeModel.js";
import Movie from "../../model/movieModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import * as cronService from "../../service/cronService.js";
import * as showtimeService from "../../service/showtimeService.js";

// CREATE
export const createShowtime = asyncHandler(async (req, res) => {
  const { theater: theaterId, id_movie: movieId, startTime } = req.body;
  try {
    const showtime = await showtimeService.createOneShowtime({ theaterId, movieId, startTime });
    return sendSuccess(res, "Tạo suất chiếu mới thành công", showtime);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

// GET ALL
export const getAllShowtimes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);

  const { result, total } = await showtimeService.fetchAllShowtimes(page, limit);

  return sendSuccess(res, "All showtimes retrieved successfully", {
    showtimes: result,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const getShowtimeById = asyncHandler(async (req, res) => {
  const showtime = await showtimeService.fetchShowtimeById(req.params.id);
  return sendSuccess(res, "Showtime retrieved successfully", { showtime });
});

export const updateShowtime = asyncHandler(async (req, res) => {
  const showtime = await showtimeService.updateShowtimeById(req.body.id, req.body);
  return sendSuccess(res, "Showtime updated successfully", showtime);
});

export const deleteShowtime = asyncHandler(async (req, res) => {
  await showtimeService.removeShowtimeById(req.params.id);
  return sendSuccess(res, "Showtime deleted successfully");
});

export const getUpcomingShowtimes = asyncHandler(async (req, res) => {
  const result = await showtimeService.fetchUpcomingShowtimes();
  return sendSuccess(res, "Upcoming showtimes retrieved successfully", result);
});

export const getShowtimesToday = asyncHandler(async (req, res) => {
  const showtimes = await showtimeService.fetchTodayShowtimes();
  return sendSuccess(res, "Today's showtimes retrieved successfully", { showtimes });
});