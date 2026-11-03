import express from "express";
import {
  createShift,
  deleteShift,
  getAllShifts,
  getShiftById,
  updateShift,
} from "../../controller/admin/shift.js";

const adminShiftRouter = express.Router();

adminShiftRouter.get("/all", getAllShifts);
adminShiftRouter.get("/:shiftID", getShiftById);
adminShiftRouter.post("/add", createShift);
adminShiftRouter.put("/update/:shiftID", updateShift);
adminShiftRouter.delete("/:shiftID", deleteShift);

export default adminShiftRouter;
