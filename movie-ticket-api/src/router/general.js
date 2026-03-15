import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import express from "express";
import Movie from "../model/movieModel.js";
import Cinema from "../model/cinemaModel.js";
import Showtime from "../model/showtimeModel.js";
import Theater from "../model/theaterModel.js";

const generalRouter = express.Router();

generalRouter.get("/showingMovies", async (req, res) => {
  try {
    const now = new Date();

    const showtimes = await Showtime.find({
      startTime: { $gte: now },
    }).populate("movie");

    const movies = [
      ...new Map(
        showtimes.map((st) => [st.movie._id.toString(), st.movie])
      ).values(),
    ];

    return sendSuccess(
      res,
      "Now showing movies retrieved successfully",
      movies
    );
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
});

generalRouter.get("/comingMovies", async (req, res) => {
  try {
    const now = new Date();
    
    const showtimes = await Showtime.find({ startTime: { $gt: now } }).populate(
      "movie"
    );

    const movies = [
      ...new Map(
        showtimes.map((st) => [st.movie._id.toString(), st.movie])
      ).values(),
    ];

    const formattedMovies = movies.map((m) => ({
      _id: m._id,
      title: m.title,
      poster: m.poster,
      duration: m.duration,
      genre: m.genre,
      releaseDate: m.releaseDate, 
    }));

    return sendSuccess(
      res,
      "Coming soon movies retrieved successfully",
      formattedMovies
    );
  } catch (err) {
    console.error(err);
    return sendServerError(res);    
  }
});

generalRouter.get("movie/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) return sendError(res, "Movie not found");
    return sendSuccess(res, "Show movie successfully", movie);
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
});

generalRouter.get("/cinema", async (req, res) => {
  try {
    const cinemas = await Cinema.find().sort({ name: 1 });
    return sendSuccess(res, "All cinemas retrieved successfully", cinemas);
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
});

generalRouter.get("/theaterByCinema", async (req, res) => {
  try {
    const theaters = await Cinema.find().populate("theaters").sort({ name: 1 });
    return sendSuccess(res, "All theaters retrieved successfully", theaters);
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
});

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
