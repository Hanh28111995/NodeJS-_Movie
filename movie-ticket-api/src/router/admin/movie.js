import {
  addMovie,
  deleteMovie,
  getAllMovies,
  updateMovie,
} from "../../controller/admin/movie.js";
import express from "express";
import { validateBody } from "../../middleware/validation.js";
import { submitNewMovie } from "../../validation/index.js";
import { handleUploadBanner } from "../../middleware/upload.js";

const adminMoviesRouter = express.Router();

adminMoviesRouter.get("/allMovies", getAllMovies);

adminMoviesRouter.post("/add", handleUploadBanner, validateBody(submitNewMovie), addMovie);

adminMoviesRouter.put("/update/:movieid", handleUploadBanner, validateBody(submitNewMovie), updateMovie);

adminMoviesRouter.delete("/delete/:movieid", deleteMovie);

export default adminMoviesRouter;
