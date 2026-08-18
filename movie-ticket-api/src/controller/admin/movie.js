import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import Movie from "../../model/movieModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import { uploadToFirebase, deleteFromFirebase } from "../../helper/firebaseStorage.js";

export const getAllMovies = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [movies, total] = await Promise.all([
    Movie.find().sort({ title: 1 }).skip(skip).limit(limit).lean(),
    Movie.countDocuments(),
  ]);

  return sendSuccess(res, "All movies retrieved successfully", {
    movies,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const searchMovies = asyncHandler(async (req, res) => {
  const { title } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const query = title
    ? { title: { $regex: title, $options: "i" } }
    : {};

  const total = await Movie.countDocuments(query);

  if (!title && total > 20) {
    return sendError(
      res,
      `Có ${total} kết quả. Vui lòng nhập chi tiết hơn để tìm kiếm phim.`
    );
  }

  const movies = await Movie.find(query).sort({ title: 1 }).skip(skip).limit(limit).lean();

  return sendSuccess(res, "Movies searched successfully", {
    movies,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const addMovie = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, "Banner image is required");

  const { publicUrl: bannerUrl } = await uploadToFirebase(req.file, "banner");
  const newMovie = await Movie.create({ ...req.body, banner: bannerUrl });
  return sendSuccess(res, "Movie added successfully", newMovie);
});

export const updateMovie = asyncHandler(async (req, res) => {
  const { movieid } = req.params;
  const movie = await Movie.findOne({ id_movie: movieid });
  if (!movie) return sendError(res, "Movie not found");

  const updateData = { ...req.body };

  if (req.file) {
    const { publicUrl } = await uploadToFirebase(req.file, "banner");
    updateData.banner = publicUrl;
  }

  const updatedMovie = await Movie.findOneAndUpdate(
    { id_movie: movieid },
    updateData,
    { new: true },
  );

  if (req.file && movie.banner) {
    await deleteFromFirebase(movie.banner);
  }

  return sendSuccess(res, "Movie updated successfully", updatedMovie);
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const { movieid } = req.params;
  const movie = await Movie.findOne({ id_movie: movieid });
  if (!movie) return sendError(res, "Movie not found");

  if (movie.banner) {
    await deleteFromFirebase(movie.banner);
  }

  await Movie.findOneAndDelete({ id_movie: movieid });
  return sendSuccess(res, "Movie deleted successfully");
});
