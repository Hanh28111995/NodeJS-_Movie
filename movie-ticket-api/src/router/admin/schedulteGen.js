import express from "express";
import {
  updateScheduleConfig,
  activeStatusChange,
  generateShowtimes,
} from "../../controller/admin/scheduleGen.js";

const scheduleGenRouter = express.Router();

scheduleGenRouter.post("/activeStatusChange", activeStatusChange);
scheduleGenRouter.post("/update", updateScheduleConfig);
scheduleGenRouter.post("/generate", generateShowtimes);

export default scheduleGenRouter;
