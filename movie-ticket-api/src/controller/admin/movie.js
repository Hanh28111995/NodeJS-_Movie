import {
  sendServerError,
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import Movies from "../../model/movieModel.js";
import { submitNewMovie } from "../../validation/index.js";

export const getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ title: 1 });
    return sendSuccess(res, "All movies retrieved successfully", movies);
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
};

export const addMovie = async (req, res) => {
  try {
    const validate = submitNewMovie(req.body);
    if (validate)
      return sendError(res, "required fields are missing or invalid");
    const newMovie = await Movies.create(req.body);
    return sendSuccess(res, "Movie added successfully", newMovie);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const updateMovie = async (req, res) => {
  try {
    const { movieid } = req.params;
    const validate = submitNewMovie(req.body);
    if (validate)
      return sendError(res, "required fields are missing or invalid");
    const updatedMovie = await Movies.findByIdAndUpdate(movieid, req.body);
    if (!updatedMovie) return sendError(res, "Movie not found");
    return sendSuccess(res, "Movie updated successfully", updatedMovie);
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { movieid } = req.params;
    const Movie = await Movies.findById(id);
    if (!Movie) {
      return sendError(res, "Movie not found");
    }
    const deletedMovie = await Movie.findByIdAndDelete(movieid);
    return sendSuccess(res, "Movie deleted successfully");
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};

export const updateMovieBanner = async (req, res) => {
  try {
    const { movieid } = req.params;
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};
