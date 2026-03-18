import express from "express";
import {
  addTheater,
  deleteTheater,
  getAllTheaters,
  getTheaterById,
  updateTheater,
} from "../../controller/admin/theater.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTheater } from "../../validation/index.js";

const adminTheaterRouter = express.Router();

adminTheaterRouter.get("/all", getAllTheaters);

adminTheaterRouter.get("/:id", getTheaterById);

adminTheaterRouter.post("/add", validateBody(submitNewTheater), addTheater);

adminTheaterRouter.put("/update/:id", validateBody(submitNewTheater), updateTheater);

adminTheaterRouter.delete("/delete/:id", deleteTheater);

export default adminTheaterRouter;
