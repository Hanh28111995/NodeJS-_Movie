import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { sendError } from "../helper/client.js";
import redisClient from "../config/Redis.js";

/**
 * 1. Rate Limiter cho API nhạy cảm (Đặt vé, giữ ghế)
 */
export const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5,                  // Tối đa 5 lần gọi
  standardHeaders: true,   
  legacyHeaders: false,    
  // 👉 Thêm keyGenerator để đọc IP chuẩn từ proxy của Vercel
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:booking:",   
  }),
  handler: (req, res) => {
    return sendError(res, "Bạn thao tác quá nhanh, vui lòng thử lại sau 1 phút!", 429);
  },
});

/**
 * 2. Rate Limiter chung cho toàn bộ hệ thống
 */
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  // 👉 Thêm keyGenerator cho global limiter
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:global:",
  }),
  handler: (req, res) => {
    return sendError(res, "Quá nhiều yêu cầu từ IP của bạn, vui lòng chầm chậm lại.", 429);
  },
});