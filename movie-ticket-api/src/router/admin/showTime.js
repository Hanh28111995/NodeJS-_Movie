import express from "express";
import {
  createShowtime,
  deleteShowtime,
  getAllShowtimes,
  getShowtimeById,
  updateShowtime,
} from "../../controller/admin/showtime.js";
import { validateBody } from "../../middleware/validation.js";
import { submitShowtime } from "../../validation/index.js";

const adminShowTimeRouter = express.Router();

adminShowTimeRouter.get("/all", getAllShowtimes);

adminShowTimeRouter.get("/showtimeDetail/:id", getShowtimeById);

adminShowTimeRouter.post("/add", validateBody(submitShowtime), createShowtime);

adminShowTimeRouter.put("/update", validateBody(submitShowtime), updateShowtime);

adminShowTimeRouter.delete("/delete/:id", deleteShowtime);

export default adminShowTimeRouter;
