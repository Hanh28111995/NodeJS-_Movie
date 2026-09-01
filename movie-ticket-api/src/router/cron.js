import express from "express";
import * as cronService from "../service/cronService.js";
import scheduleGenService from "../service/scheduleGenService.js";
import { sendSuccess } from "../helper/client.js";
import asyncHandler from "../util/asyncHandler.js";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const cronRouter = express.Router();

const verifyCronSecret = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;  
  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return res.status(500).json({
      success: false,
      message: "Cron authentication is not configured",
    });
  }
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
  next();
};

cronRouter.get("/cleanup-tickets", verifyCronSecret, asyncHandler(async (req, res) => {
  const result = await cronService.cleanupExpiredTickets();
  return sendSuccess(res, result.message, result);
}));

cronRouter.get("/generate-showtimes", verifyCronSecret, asyncHandler(async (req, res) => {
  const result = await scheduleGenService.generateSchedule();
  return sendSuccess(res, `Generate xong: ${result.created} mới, ${result.updated} cập nhật`, result);
}));



export default cronRouter;
