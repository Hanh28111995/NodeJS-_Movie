import express from "express";
import {
  createShowtime,
  deleteShowtime,
  getAllShowtimes,
  updateShowtime,
} from "../../controller/admin/showtime";

const adminShowTimeRouter = express.Router();

/**
 * @route GET /api/admin/showtime/all
 * @description get all showtimes and details
 * @access private (admin only)
 */

adminShowTimeRouter.get("/all", getAllShowtimes);
/**
 * @route GET /api/admin/showtime/:id
 * @description get all showtimes and details
 * @access private (admin only)
 */

adminShowTimeRouter.get("/:id", getAllShowtimes);


/**
 * @route POST /api/admin/showtime/add
 * @description Add a new showtime
 * @access private (admin only)
 */
adminShowTimeRouter.post("/add", createShowtime);

/**
 * @route PUT /api/admin/showtime/update/:id
 * @description edit showtime by id
 * @access private (admin only)
 */
adminShowTimeRouter.put("update/:id", updateShowtime);

/**
 * @route DELETE /api/admin/showtime/delete/:id
 * @description delete showtime by id
 * @access private (admin only)
 */
adminShowTimeRouter.delete("delete/:id", deleteShowtime);

export default adminShowTimeRouter;
