import { sendSuccess, sendError } from "../helper/client.js";
import express from "express";
import Movie from "../model/movieModel.js";
import Cinema from "../model/cinemaModel.js";
import Showtime from "../model/showtimeModel.js";
import asyncHandler from "../util/asyncHandler.js";
import Theater from "../model/theaterModel.js";
import SeatType from "../model/seatTypeModel.js";

const generalRouter = express.Router();

// Middleware để thêm cache header cho các API lấy dữ liệu công khai
const setCache = (req, res, next) => {
  // Cache 1 phút, cho phép sử dụng dữ liệu cũ trong 30 giây khi đang revalidate
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
  next();
};

generalRouter.get("/showingMovies", setCache, asyncHandler(async (req, res) => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gte: now } }).populate("id_movie").lean();
  const movies = [...new Map(showtimes.map((st) => [st.id_movie._id.toString(), st.id_movie])).values()];
  return sendSuccess(res, "Now showing movies retrieved successfully", movies);
}));

generalRouter.get("/comingMovies", setCache, asyncHandler(async (req, res) => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gt: now } }).populate("id_movie").lean();
  const movies = [...new Map(showtimes.map((st) => [st.id_movie._id.toString(), st.id_movie])).values()];
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

generalRouter.get("/showBanners", setCache, asyncHandler(async (req, res) => {
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

generalRouter.get("/movie/all", setCache, asyncHandler(async (req, res) => {
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

  let conditions = [];

  if (idMovie) {
    conditions.push({ id_movie: idMovie });
  }

  if (branch) {
    // Theater lưu cinemaName và branch dạng string → filter trực tiếp qua theater
    const theaterIds = await Theater.find({
      $or: [{ branch: branch }, { cinemaName: branch }]
    }).distinct("_id");
    if (theaterIds.length === 0) {
      return sendSuccess(res, "Filtered showtimes retrieved successfully", []);
    }
    conditions.push({ theater: { $in: theaterIds } });
  }

  if (date) {
    const d1 = new Date(date);
    const d2 = new Date(date);
    d2.setDate(d2.getDate() + 1);
    conditions.push({ startTime: { $gte: d1, $lt: d2 } });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  const showtimes = await Showtime.find(query)
    .select("_id startTime theater")
    .lean();

  const result = showtimes.map(st => ({
    _id: st._id,
    startTime: st.startTime,
    theater: st.theater,
  }));

  return sendSuccess(res, "Filtered showtimes retrieved successfully", result);
}));

generalRouter.get("/seatTypes", asyncHandler(async (req, res) => {
  const seatTypes = await SeatType.find().lean();
  return sendSuccess(res, "All seat types retrieved successfully", seatTypes);
}));

export default generalRouter;
