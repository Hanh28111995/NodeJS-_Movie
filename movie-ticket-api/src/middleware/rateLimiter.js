import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { sendError } from "../helper/client.js";
import redisClient from "../config/Redis.js";

/**
 * 1. Rate Limiter cho API nhạy cảm (Đặt vé, giữ ghế)
 * Giới hạn: Tối đa 5 request trong vòng 1 phút từ 1 IP
 */
export const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5,                  // Tối đa 5 lần gọi
  standardHeaders: true,   // Trả về thông tin giới hạn qua header `RateLimit-*`
  legacyHeaders: false,    // Tắt header `X-RateLimit-*` cũ
  store: new RedisStore({
    // Sửa lại thành sendCommand(args) thay vì call(...args)
    sendCommand: (args) => redisClient.sendCommand(args),
    prefix: "rl:booking:",   // Tiền tố phân biệt trên Redis
  }),
  handler: (req, res) => {
    return sendError(res, "Bạn thao tác quá nhanh, vui lòng thử lại sau 1 phút!", 429);
  },
});

/**
 * 2. Rate Limiter chung cho toàn bộ hệ thống (Chống DDoS cơ bản)
 * Giới hạn: Tối đa 100 request trong vòng 1 phút từ 1 IP
 */
export const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // Sửa lại thành sendCommand(args) thay vì call(...args)
    sendCommand: (args) => redisClient.sendCommand(args),
    prefix: "rl:global:",
  }),
  handler: (req, res) => {
    return sendError(res, "Quá nhiều yêu cầu từ IP của bạn, vui lòng chầm chậm lại.", 429);
  },
});