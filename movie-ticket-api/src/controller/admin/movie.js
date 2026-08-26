import {
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import movieService from "../../service/admin/movieService.js";

export const getAllMovies = asyncHandler(async (req, res) => {
  const result = await movieService.getAllMovies(req.query);
  return sendSuccess(res, "All movies retrieved successfully", result);
});

export const searchMovies = asyncHandler(async (req, res) => {
  try {
    const result = await movieService.searchMovies(req.query);
    return sendSuccess(res, "Movies searched successfully", result);
  } catch (error) {
    if (error.statusCode === 400) {
      return sendError(res, error.message);
    }
    throw error;
  }
});

export const getMovieDetail = asyncHandler(async (req, res) => {
  try {
    const { movieid } = req.params; 
    const movie = await movieService.getMovieById(movieid);
    return sendSuccess(res, "Movie retrieved successfully", movie);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});

export const addMovie = asyncHandler(async (req, res) => {
  try {
    const newMovie = await movieService.addMovie(req.body, req.file);
    return sendSuccess(res, "Movie added successfully", newMovie);
  } catch (error) {
    if (error.statusCode === 400) {
      return sendError(res, error.message);
    }
    throw error;
  }
});

export const updateMovie = asyncHandler(async (req, res) => {
  try {
    const updatedMovie = await movieService.updateMovie(req.body, req.file);
    return sendSuccess(res, "Movie updated successfully", updatedMovie);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message);
    }
    throw error;
  }
});

export const deleteMovie = asyncHandler(async (req, res) => {
  try {
    const { movieid } = req.params;
    await movieService.deleteMovie(movieid);
    return sendSuccess(res, "Movie deleted successfully");
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message);
    }
    throw error;
  }
});