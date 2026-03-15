import express from "express";
import { addSeatType, deleteSeatType, getSeatType, updateSeatType } from "../../controller/admin/seatType.js";

const adminSeatTypeRouter = express.Router();

/**
 * @route GET /api/admin/movie/allMovies
 * @description get all movies and details
 * @access private (admin only)
 */

adminSeatTypeRouter.get("/allSeatType", getSeatType);

/**
 * @route POST /api/admin/movie/add
 * @description Add a new movie
 * @access private (admin only)
 */
adminSeatTypeRouter.post("/add", addSeatType);

/**
 * @route PUT /api/admin/movie/:id
 * @description edit movie by id
 * @access private (admin only)
 */
adminSeatTypeRouter.put("update/:id", updateSeatType);

/**
 * @route DELETE /api/movies/:id
 * @description delete movie by id
 * @access private (admin only)
 */
adminSeatTypeRouter.delete("delete/:id", deleteSeatType );

export default adminSeatTypeRouter;
