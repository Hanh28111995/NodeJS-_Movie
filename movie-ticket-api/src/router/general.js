import { sendSuccess } from "../helper/client.js";
import express from "express";
import Movie from "../model/movieModel.js";
import Cinema from "../model/cinemaModel.js";
import Showtime from "../model/showtimeModel.js";
import asyncHandler from "../util/asyncHandler.js";

const generalRouter = express.Router();

generalRouter.get("/showingMovies", asyncHandler(async (req, res) => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gte: now } }).populate("movie");
  const movies = [...new Map(showtimes.map((st) => [st.movie._id.toString(), st.movie])).values()];
  return sendSuccess(res, "Now showing movies retrieved successfully", movies);
}));

generalRouter.get("/comingMovies", asyncHandler(async (req, res) => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gt: now } }).populate("movie");
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

generalRouter.get("/movie/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const movie = await Movie.findById(id);
  return sendSuccess(res, "Show movie successfully", movie);
}));

generalRouter.get("/cinema", asyncHandler(async (req, res) => {
  const cinemas = await Cinema.find();
  return sendSuccess(res, "All cinemas retrieved successfully", cinemas);
}));

generalRouter.get("/theaterByCinema", asyncHandler(async (req, res) => {
  const theaters = await Cinema.find().populate("theaters");
  return sendSuccess(res, "All theaters retrieved successfully", theaters);
}));

generalRouter.get("/theaters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const theaterTarget = await Theater.findById(id).sort({ name: 1 });
    if (!theaterTarget) return sendError(res, "Theater not found");
    return sendSuccess(res, "Theater retrieved successfully", theaterTarget);
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
});



generalRouter.get("/showtime/filter", async (req, res) => {
  try {
    const { movie, cinema, theater, date } = req.query;

    let query = {};

    if (movie) query.movie = movie;
    if (cinema) query.cinema = cinema;
    if (theater) query.theater = theater;

    if (date) {
      const d1 = new Date(date);
      const d2 = new Date(date);
      d2.setDate(d2.getDate() + 1);
      query.startTime = { $gte: d1, $lt: d2 };
    }

    const showtimes = await Showtime.find(query)
      .populate("movies")
      .populate("cinemas")
      .populate("theaters");

    return sendSuccess(
      res,
      "Filtered showtimes retrieved successfully",
      showtimes
    );
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
});

export default generalRouter;
