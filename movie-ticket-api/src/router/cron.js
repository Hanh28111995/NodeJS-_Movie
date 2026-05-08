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

// cronRouter.get("/generate-showtimes", verifyCronSecret, asyncHandler(async (req, res) => {
//   const result = await scheduleGenService.generate();
//   return sendSuccess(res, `Generate xong: ${result.created} mới, ${result.updated} cập nhật`, result);
// }));

cronRouter.get("/generate-showtimes", verifyCronSecret, async (req, res) => {
    console.log(">>> BẮT ĐẦU CHẠY ROUTE GENERATE");
    try {
        // Log để kiểm tra service có tồn tại không
        console.log("Check Service:", !!scheduleGenService);
        console.log("Check Function:", !!scheduleGenService.generate);

        const result = await scheduleGenService.generate();
        
        console.log(">>> KẾT QUẢ TỪ SERVICE:", result);
        return res.status(200).json(result);
    } catch (error) {
        console.error("!!! LỖI CỰC NẶNG TẠI ROUTE:", error.message);
        console.error(error.stack);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
});

export default cronRouter;
