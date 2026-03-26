import express from "express";
import {
  addCinema,
  deleteCinema,
  getAllCinemas,
  updateCinema,
} from "../../controller/admin/cinema.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewCinema } from "../../validation/index.js";

const adminCinemaRouter = express.Router();

adminCinemaRouter.get("/all", getAllCinemas);

adminCinemaRouter.post("/add", validateBody(submitNewCinema), addCinema);

adminCinemaRouter.put("/update", validateBody(submitNewCinema), updateCinema);

adminCinemaRouter.delete("/:cinemaId/delete", deleteCinema);

export default adminCinemaRouter;
