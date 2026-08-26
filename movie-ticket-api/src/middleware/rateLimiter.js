import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { sendError } from "../helper/client.js";
import redisClient from "../config/Redis.js";

/**
 * 1. Rate Limiter cho API nhạy cảm (Đặt vé, giữ ghế)
 */
export const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5,                   // Tối đa 5 lần gọi
  standardHeaders: true,   
  legacyHeaders: false,    
  
  // 👉 Dùng ipKeyGenerator chuẩn để xử lý IPv4, IPv6 và proxy an toàn
  keyGenerator: (req, res) => {
    return ipKeyGenerator(req, res);
  },

  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:booking:",   
  }),
  handler: (req, res) => {
    return sendError(res, "Too many requests, please try again after 1 minute!", 429);
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
  
  // 👉 Dùng ipKeyGenerator chuẩn ở đây luôn
  keyGenerator: (req, res) => {
    return ipKeyGenerator(req, res);
  },

  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:global:",
  }),
  handler: (req, res) => {
    return sendError(res, "Too many requests from your IP, please slow down.", 429);
  },
});