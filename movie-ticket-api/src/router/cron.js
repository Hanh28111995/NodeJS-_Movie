import express from "express";
import * as cronService from "../service/cronService.js";
import { sendSuccess } from "../helper/client.js";
import asyncHandler from "../util/asyncHandler.js";

const cronRouter = express.Router();

/**
 * @route   GET /api/cron/cleanup-tickets
 * @desc    Trigger xử lý vé hết hạn (Dành cho Vercel Cron Jobs)
 * @access  Public (Nhưng nên bảo mật bằng Token hoặc Secret trong thực tế)
 */
cronRouter.get("/cleanup-tickets", asyncHandler(async (req, res) => {
  // Kiểm tra Secret Token từ Vercel để tránh người lạ gọi bừa bãi (Optional)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const result = await cronService.cleanupExpiredTickets();
  return sendSuccess(res, result.message, result);
}));

export default cronRouter;
