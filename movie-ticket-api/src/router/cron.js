import express from "express";
import * as cronService from "../service/cronService.js";
import * as scheduleGenService from "../service/scheduleGenService.js";
import { sendSuccess } from "../helper/client.js";
import asyncHandler from "../util/asyncHandler.js";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const cronRouter = express.Router();

// Middleware kiểm tra CRON_SECRET dùng chung
const verifyCronSecret = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
};

cronRouter.get("/cleanup-tickets", verifyCronSecret, asyncHandler(async (req, res) => {
  const result = await cronService.cleanupExpiredTickets();
  return sendSuccess(res, result.message, result);
}));

cronRouter.get("/generate-showtimes", verifyCronSecret, asyncHandler(async (req, res) => {
  const result = await scheduleGenService.generate();
  return sendSuccess(res, `Generate xong: ${result.created} mới, ${result.updated} cập nhật`, result);
}));

export default cronRouter;
