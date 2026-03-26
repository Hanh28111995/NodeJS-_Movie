import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import Movie from "../../model/movieModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import { bucket } from "../../middleware/firebase.js";
import fs from "fs";

export const getAllMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find().sort({ title: 1 }).lean();
  return sendSuccess(res, "All movies retrieved successfully", {
    movies: movies,
  });
});

export const addMovie = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, "Banner image is required");

  const localPath = req.file.path;
  const remotePath = `banner/${Date.now()}_${req.file.originalname}`;
  const fileRef = bucket.file(remotePath);

  await bucket.upload(localPath, {
    destination: remotePath,
    metadata: { contentType: req.file.mimetype },
  });
  await fileRef.makePublic();
  const bannerUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
  fs.unlinkSync(localPath);

  const newMovie = await Movie.create({ ...req.body, banner: bannerUrl });
  return sendSuccess(res, "Movie added successfully", newMovie);
});

export const updateMovie = asyncHandler(async (req, res) => {
  const { movieid } = req.params;
  const movie = await Movie.findOne({ id_movie: movieid });
  if (!movie) return sendError(res, "Movie not found");

  const updateData = { ...req.body };

  if (req.file) {
    const localPath = req.file.path;
    const remotePath = `banner/${Date.now()}_${req.file.originalname}`;
    const fileRef = bucket.file(remotePath);

    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: { contentType: req.file.mimetype },
    });
    await fileRef.makePublic();
    updateData.banner = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
    fs.unlinkSync(localPath);
  }

  const updatedMovie = await Movie.findOneAndUpdate(
    { id_movie: movieid },
    updateData,
    { new: true },
  );

  if (req.file && movie.banner) {
    try {
      const oldRemotePath = movie.banner.split(`${bucket.name}/`)[1];
      if (oldRemotePath) await bucket.file(oldRemotePath).delete();
    } catch (err) {
      console.log("Failed to delete old banner from Firebase:", err.message);
    }
  }

  return sendSuccess(res, "Movie updated successfully", updatedMovie);
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const { movieid } = req.params;
  const movie = await Movie.findOne({ id_movie: movieid });
  if (!movie) return sendError(res, "Movie not found");

  if (movie.banner) {
    try {
      const remotePath = movie.banner.split(`${bucket.name}/`)[1];
      if (remotePath) await bucket.file(remotePath).delete();
    } catch (err) {
      console.log("Failed to delete banner from Firebase:", err.message);
    }
  }

  await Movie.findOneAndDelete({ id_movie: movieid });
  return sendSuccess(res, "Movie deleted successfully");
});
