import { sendSuccess, sendError } from "../../helper/client.js";
import Showtime from "../../model/showtimeModel.js";
import Movie from "../../model/movieModel.js";
import Theater from "../../model/theaterModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import * as cronService from "../../service/cronService.js";

// CREATE
export const createShowtime = asyncHandler(async (req, res) => {
  const { theater: theaterId, movie, startTime } = req.body;
  const movieId = movie;

  const theater = await Theater.findById(theaterId).lean();
  if (!theater) return sendError(res, "Theater not found", 404);

  // Generate seats từ theater, reset isBooked về false
  const seats = theater.seats.map(({ seatNumber, seatType }) => ({
    seatNumber,
    seatType,
    isBooked: false,
  }));

  const showtime = await Showtime.create({
    id_movie: movieId,
    theater: theaterId,
    cinema: theater.cinema,
    startTime,
    seats,
  });

  return sendSuccess(res, "Showtime created successfully", showtime);
});

// GET ALL
export const getAllShowtimes = asyncHandler(async (req, res) => {
  const showtimes = await Showtime.find()
    .populate("cinema")
    .populate("theater")
    .lean();

  const movieIds = [...new Set(showtimes.map(st => st.id_movie?.toString()).filter(Boolean))];
  const movies = await Movie.find({ _id: { $in: movieIds } }).select("_id title").lean();
  const movieMap = Object.fromEntries(movies.map(m => [m._id.toString(), m]));

  const result = showtimes.map(st => ({
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

  if (!showtime) return sendSuccess(res, "Showtime retrieved successfully", showtime);

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
    ...updatedShowtime,
    id_movie: movie || updatedShowtime.id_movie,
  });
});

// UPDATE
export const updateShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  return sendSuccess(res, "Showtime updated successfully", showtime);
});

// DELETE
export const deleteShowtime = asyncHandler(async (req, res) => {
  await Showtime.findByIdAndDelete(req.params.id);
  return sendSuccess(res, "Showtime deleted successfully");
});
