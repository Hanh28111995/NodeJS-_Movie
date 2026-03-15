import { sendSuccess } from "../../helper/client.js";
import Movie from "../../model/movieModel.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getAllMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find().sort({ title: 1 }).lean();
  return sendSuccess(res, "All movies retrieved successfully", movies);
});

export const addMovie = asyncHandler(async (req, res) => {
  const newMovie = await Movie.create(req.body);
  return sendSuccess(res, "Movie added successfully", newMovie);
});

export const updateMovie = asyncHandler(async (req, res) => {
  const { movieid } = req.params;
  const updatedMovie = await Movie.findByIdAndUpdate(movieid, req.body, { new: true });
  return sendSuccess(res, "Movie updated successfully", updatedMovie);
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const { movieid } = req.params;
  await Movie.findByIdAndDelete(movieid);
  return sendSuccess(res, "Movie deleted successfully");
});
