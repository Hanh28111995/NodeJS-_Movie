import { sendError, sendServerError, sendSuccess } from "../../helper/client";
import Showtime from "../../model/showtimeModel";

// CREATE
export const createShowtime = async (req, res) => {
  try {
    const validate = submitShowtime(req.body);
    if (validate) return sendError(res, validate);
    const showtime = await Showtime.create(req.body);
    return sendSuccess(res, "Showtime created successfully", showtime);
  } catch (error) {
    return sendServerError(res);
  }
};

// GET ALL
export const getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movie")
      .populate("cinema")
      .populate("theater");

    return sendSuccess(res, "All showtimes retrieved successfully", showtimes);
  } catch (error) {
    return sendServerError(res);
  }
};

// GET ONE
export const getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movie")
      .populate("cinema")
      .populate("theater");

    if (!showtime) return sendError(res, "Showtime not found");

    return sendSuccess(res, "Showtime retrieved successfully", showtime);
  } catch (error) {
    return sendServerError(res);
  }
};

// UPDATE
export const updateShowtime = async (req, res) => {
  try {
    const validate = submitShowtime(req.body);
    if (validate) return sendError(res, validate);
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!showtime) return sendError(res, "Showtime not found");
    return sendSuccess(res, "Showtime updated successfully", showtime);
  } catch (error) {
    return sendServerError(res);
  }
};

// DELETE
export const deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    if (!showtime) return sendError(res, "Showtime not found");

    return sendSuccess(res, "Showtime deleted successfully");
  } catch (error) {
    return sendServerError(res);
  }
};
