import express from "express";
import {
  createStaffShift,
  deleteStaffShift,
  getAllStaffShifts,
  getStaffShiftByID,
  updateStaffShift,
} from "../../controller/admin/staffShift.js";

const adminStaffShiftRouter = express.Router();

adminStaffShiftRouter.get("/all", getAllStaffShifts);
adminStaffShiftRouter.get("/:staffShiftID", getStaffShiftByID);
adminStaffShiftRouter.post("/add", createStaffShift);
adminStaffShiftRouter.put("/update/:staffShiftID", updateStaffShift);
adminStaffShiftRouter.delete("/:staffShiftID", deleteStaffShift);

export default adminStaffShiftRouter;
