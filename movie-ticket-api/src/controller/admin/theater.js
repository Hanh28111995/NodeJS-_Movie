import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import theaterService from "../../service/admin/theaterService.js";

export const getAllTheaters = asyncHandler(async (req, res) => {
  const result = await theaterService.getAllTheaters();
  return sendSuccess(res, "Theaters retrieved successfully", result);
});

export const getTheaterById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const result = await theaterService.getTheaterById(id);
    return sendSuccess(res, "Theater retrieved successfully", result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const addTheater = asyncHandler(async (req, res) => {
  const newTheater = await theaterService.addTheater(req.body);
  return sendSuccess(res, "Theater added successfully", newTheater);
});

export const updateTheater = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTheater = await theaterService.updateTheater(id, req.body);
    return sendSuccess(res, "Theater updated successfully", updatedTheater);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const deleteTheater = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await theaterService.deleteTheater(id);
    return sendSuccess(res, "Theater deleted successfully");
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});
