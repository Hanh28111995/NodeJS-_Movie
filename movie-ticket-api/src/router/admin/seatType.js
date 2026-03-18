import express from "express";
import { addSeatType, deleteSeatType, getSeatType, updateSeatType } from "../../controller/admin/seatType.js";
import { validateBody } from "../../middleware/validation.js";
import { submitSeatType } from "../../validation/index.js";

const adminSeatTypeRouter = express.Router();

adminSeatTypeRouter.get("/allSeatTypes", getSeatType);

adminSeatTypeRouter.post("/add", validateBody(submitSeatType), addSeatType);

adminSeatTypeRouter.put("/update/:id", validateBody(submitSeatType), updateSeatType);

adminSeatTypeRouter.delete("/delete/:id", deleteSeatType);

export default adminSeatTypeRouter;
