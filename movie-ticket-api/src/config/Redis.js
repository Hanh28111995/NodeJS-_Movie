import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

// Khởi tạo client sử dụng REDIS_URL từ file .env (hoặc Vercel Environment Variables)
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

// Kết nối
await redisClient.connect()
  .then(() => console.log("Redis connected successfully "))
  .catch((err) => console.error("Redis connection failed ", err));

export default redisClient;