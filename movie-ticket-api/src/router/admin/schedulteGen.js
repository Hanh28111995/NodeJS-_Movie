import express from "express";
import {
  getSchedulePlan,
  editSchedulePlan,
  createSchedulePlan,
  generateSchedulePlan
} from "../../controller/admin/scheduleGen.js";

const scheduleGenRouter = express.Router();

scheduleGenRouter.get("/get", getSchedulePlan);
scheduleGenRouter.put("/update", editSchedulePlan);
scheduleGenRouter.post("/create", createSchedulePlan);
scheduleGenRouter.post("/generate", generateSchedulePlan); 

export default scheduleGenRouter;
