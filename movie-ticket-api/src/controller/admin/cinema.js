import {
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import cinemaService from "../../service/admin/cinemaService.js"

export const getAllCinemas = asyncHandler(async (req, res) => {
  const result = await cinemaService.getAllCinemas();
  return sendSuccess(res, "Cinemas retrieved successfully", result);
});

export const addCinema = asyncHandler(async (req, res) => {
  try {
    const newCinema = await cinemaService.addCinema(req.body);
    return sendSuccess(res, "Cinema added successfully", newCinema);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const updateCinema = asyncHandler(async (req, res) => {
  try {
    const updatedCinema = await cinemaService.updateCinema(req.body);
    return sendSuccess(res, "Cinema updated successfully", updatedCinema);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const deleteCinema = asyncHandler(async (req, res) => {
  try {
    const { cinemaId } = req.params;
    await cinemaService.deleteCinema(cinemaId);
    return sendSuccess(res, "Cinema deleted successfully");
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});