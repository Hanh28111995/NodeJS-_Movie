import { get } from "mongoose";
import {
  addMovie,
  deleteMovie,
  getAllMovies,
  updateMovie,
} from "../../controller/admin/movie.js";

import express from "express";

const adminMoviesRouter = express.Router();

/**
 * @route GET /api/admin/movie/allMovies
 * @description get all movies and details
 * @access private (admin only)
 */

adminMoviesRouter.get("/allMovies", getAllMovies);

/**
 * @route POST /api/admin/movie/add
 * @description Add a new movie
 * @access private (admin only)
 */
adminMoviesRouter.post("/add", addMovie);

/**
 * @route PUT /api/admin/movie/:id
 * @description edit movie by id
 * @access private (admin only)
 */
adminMoviesRouter.put("update/:movieid", updateMovie);

/**
 * @route DELETE /api/movies/:id
 * @description delete movie by id
 * @access private (admin only)
 */
adminMoviesRouter.delete("delete/:movieid", deleteMovie);

export default adminMoviesRouter;
