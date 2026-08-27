import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import showtimeService from "../../service/admin/showtimeService.js";

// CREATE
export const createShowtime = asyncHandler(async (req, res) => {
  try {
    const { theater: theaterId, id_movie: movieId, startTime, cinema } = req.body;
    const showtime = await showtimeService.createOneShowtime({ theaterId, movieId, startTime, cinema });
    return sendSuccess(res, "Showtime created successfully", showtime);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 400);
  }
});

// GET ALL (Phân trang)
export const getAllShowtimes = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);

  const { result, total } = await showtimeService.fetchAllShowtimes(page, limit);

  return sendSuccess(res, "All showtimes retrieved successfully", {
    showtimes: result,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

// GET BY ID
export const getShowtimeById = asyncHandler(async (req, res) => {
  try {
    const showtime = await showtimeService.fetchShowtimeById(req.params.id);
    return sendSuccess(res, "Showtime retrieved successfully", { showtime });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

// UPDATE
export const updateShowtime = asyncHandler(async (req, res) => {
  try {
    const showtimeId = req.body.id || req.params.id;
    const showtime = await showtimeService.updateShowtimeById(showtimeId, req.body);
    return sendSuccess(res, "Showtime updated successfully", showtime);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

// DELETE
export const deleteShowtime = asyncHandler(async (req, res) => {
  try {
    await showtimeService.removeShowtimeById(req.params.id);
    return sendSuccess(res, "Showtime deleted successfully");
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

// GET UPCOMING
export const getUpcomingShowtimes = asyncHandler(async (req, res) => {
  const result = await showtimeService.fetchUpcomingShowtimes();
  return sendSuccess(res, "Upcoming showtimes retrieved successfully", { showtimes: result });
});

// GET TODAY
export const getShowtimesToday = asyncHandler(async (req, res) => {
  const showtimes = await showtimeService.fetchTodayShowtimes();
  return sendSuccess(res, "Today's showtimes retrieved successfully", { showtimes });
});