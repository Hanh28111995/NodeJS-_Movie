import {
  addMovie,
  deleteMovie,
  getAllMovies,
  getMovieDetail,
  searchMovies,
  updateMovie,
} from "../../controller/admin/movie.js";
import express from "express";
import { validateBody } from "../../middleware/validation.js";
import { submitNewMovie } from "../../validation/index.js";
import { handleUploadBanner } from "../../middleware/upload.js";

const adminMoviesRouter = express.Router();

adminMoviesRouter.get("/allMovies", getAllMovies);

adminMoviesRouter.get("/search", searchMovies);

adminMoviesRouter.get("/:movieid", getMovieDetail);

adminMoviesRouter.post("/add", handleUploadBanner, validateBody(submitNewMovie), addMovie);

adminMoviesRouter.put("/update", handleUploadBanner, validateBody(submitNewMovie), updateMovie);

adminMoviesRouter.delete("/delete/:movieid", deleteMovie);

export default adminMoviesRouter;
