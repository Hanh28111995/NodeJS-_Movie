import redisClient from "../config/Redis.js";



export const cacheMiddleware = (key, ttlSeconds = 300) => {
  return async (req, res, next) => {
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        // Nếu có cache trên Redis, trả về ngay lập tức không cần query DB
        return sendSuccess(res, "Retrieved from Redis cache successfully", JSON.parse(cachedData));
      }
      
      // Gắn một hàm helper vào res để route handler có thể gọi và lưu cache tự động
      res.sendWithCache = async (message, data) => {
        await redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds });
        return sendSuccess(res, message, data);
      };
      
      next();
    } catch (err) {
      // Nếu Redis lỗi, fallback cho phép chạy tiếp xuống DB bình thường để app không bị sập
      next();
    }
  };
};