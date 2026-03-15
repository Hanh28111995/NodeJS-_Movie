import { sendSuccess } from "../../helper/client.js";
import Showtime from "../../model/showtimeModel.js";
import asyncHandler from "../../util/asyncHandler.js";

// CREATE
export const createShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.create(req.body);
  return sendSuccess(res, "Showtime created successfully", showtime);
});

// GET ALL
export const getAllShowtimes = asyncHandler(async (req, res) => {
  const showtimes = await Showtime.find()
    .populate("movie")
    .populate("cinema")
    .populate("theater");

  return sendSuccess(res, "All showtimes retrieved successfully", showtimes);
});

// GET ONE
export const getShowtimeById = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id)
    .populate("movie")
    .populate("cinema")
    .populate("theater");

  return sendSuccess(res, "Showtime retrieved successfully", showtime);
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
