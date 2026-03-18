import { sendSuccess } from "../helper/client.js";
import express from "express";
import Movie from "../model/movieModel.js";
import Cinema from "../model/cinemaModel.js";
import Showtime from "../model/showtimeModel.js";
import asyncHandler from "../util/asyncHandler.js";

import Theater from "../model/theaterModel.js";
import { sendError } from "../helper/client.js";

const generalRouter = express.Router();

generalRouter.get("/showingMovies", asyncHandler(async (req, res) => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gte: now } }).populate("movie").lean();
  const movies = [...new Map(showtimes.map((st) => [st.movie._id.toString(), st.movie])).values()];
  return sendSuccess(res, "Now showing movies retrieved successfully", movies);
}));

generalRouter.get("/comingMovies", asyncHandler(async (req, res) => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gt: now } }).populate("movie").lean();
  const movies = [...new Map(showtimes.map((st) => [st.movie._id.toString(), st.movie])).values()];
  const formattedMovies = movies.map((m) => ({
    _id: m._id,
    title: m.title,
    banner: m.banner,
    duration: m.duration,
    genre: m.genre,
    releaseDate: m.releaseDate,
  }));
  return sendSuccess(res, "Coming soon movies retrieved successfully", formattedMovies);
}));

generalRouter.get("/showBanners", asyncHandler(async (req, res) => {
  // Lấy 5 phim mới nhất để làm banner
  const movies = await Movie.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select("title banner")
    .lean();

  const banners = movies.map(m => ({
    _id: m._id,
    title: m.title,
    banner: m.banner
  }));

  return sendSuccess(res, "Banners retrieved successfully", banners);
}));

generalRouter.get("/movie/all", asyncHandler(async (req, res) => {
  const { title } = req.query;
  const query = title ? { title: { $regex: title, $options: "i" } } : {};
  const movies = await Movie.find(query).sort({ releaseDate: -1 }).lean();
  return sendSuccess(res, "All movies retrieved successfully", movies);
}));

generalRouter.get("/movie/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === "all") {
    const { title } = req.query;
    const query = title ? { title: { $regex: title, $options: "i" } } : {};
    const movies = await Movie.find(query).sort({ releaseDate: -1 }).lean();
    return sendSuccess(res, "All movies retrieved successfully", movies);
  }

  // Tìm theo id_movie (nanoid) hoặc _id (ObjectId)
  const movie = await Movie.findOne({
    $or: [
      { id_movie: id },
      ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : [])
    ]
  }).lean();

  if (!movie) return sendError(res, "Movie not found", 404);
  return sendSuccess(res, "Movie retrieved successfully", movie);
}));

generalRouter.get("/cinema", asyncHandler(async (req, res) => {
  const cinemas = await Cinema.find().lean();
  return sendSuccess(res, "All cinemas retrieved successfully", cinemas);
}));

generalRouter.get("/cinemaBranches", asyncHandler(async (req, res) => {
  const { location } = req.query;

  let query = {};
  if (location) {
    query.address = { $regex: location, $options: "i" };
  }

  const cinemas = await Cinema.find(query).lean();

  const formattedCinemas = cinemas.map(c => ({
    branch: c.branch,
    cinemaName: c.cinemaName,
    address: c.address,
    coordinates: c.coordinates
  }));

  return sendSuccess(res, "Cinema branches retrieved successfully", formattedCinemas);
}));

generalRouter.get("/locations", asyncHandler(async (req, res) => {
  const cinemas = await Cinema.find().select("address").lean();

  const locationMap = {};

  cinemas.forEach((c, index) => {
    const parts = c.address.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      const city = parts[parts.length - 1];
      const district = parts[parts.length - 2];

      if (!locationMap[city]) {
        locationMap[city] = {
          _id: city,
          vungMien: city,
          cumRap: new Set()
        };
      }
      locationMap[city].cumRap.add(district);
    }
  });

  const formattedLocations = Object.values(locationMap).map(item => ({
    ...item,
    cumRap: Array.from(item.cumRap)
  }));

  return sendSuccess(res, "Locations retrieved successfully", formattedLocations);
}));

generalRouter.get("/theaterByCinema", asyncHandler(async (req, res) => {
  const theaters = await Cinema.find().populate("theaters").lean();
  return sendSuccess(res, "All theaters retrieved successfully", theaters);
}));

generalRouter.get("/theaters/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const theaterTarget = await Theater.findById(id).lean();
  if (!theaterTarget) return sendError(res, "Theater not found", 404);
  return sendSuccess(res, "Theater retrieved successfully", theaterTarget);
}));

generalRouter.get("/showtime/filter", asyncHandler(async (req, res) => {
  const { branch, date, idMovie } = req.query;

  let query = {};

  if (idMovie) {
    query.movie = idMovie;
  }

  if (branch) {
    const cinemaDoc = await Cinema.findOne({
      $or: [{ cinemaName: branch }, { branch: branch }],
    })
      .select("_id")
      .lean();
    if (cinemaDoc) {
      query.cinema = cinemaDoc._id;
    } else {
      return sendSuccess(res, "Filtered showtimes retrieved successfully", []);
    }
  }

  if (date) {
    const d1 = new Date(date);
    const d2 = new Date(date);
    d2.setDate(d2.getDate() + 1);
    query.startTime = { $gte: d1, $lt: d2 };
  }

  const showtimes = await Showtime.find(query)
    .populate("movie")
    .populate("cinema")
    .populate("theater")
    .lean();

  return sendSuccess(
    res,
    "Filtered showtimes retrieved successfully",
    showtimes
  );
}));

export default generalRouter;
