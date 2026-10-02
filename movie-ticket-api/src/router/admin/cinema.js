import express from "express";
import {
  addCinema,
  deleteCinema,
  getAllCinemas,
  getCinemaDetail,
  updateCinema,
} from "../../controller/admin/cinema.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewCinema } from "../../validation/index.js";

const adminCinemaRouter = express.Router();

adminCinemaRouter.get("/all", getAllCinemas);

adminCinemaRouter.get("/:cinemaId", getCinemaDetail);

adminCinemaRouter.post("/add", validateBody(submitNewCinema), addCinema);

adminCinemaRouter.put("/update", validateBody(submitNewCinema), updateCinema);

adminCinemaRouter.delete("/:cinemaId/delete", deleteCinema);

export default adminCinemaRouter;
