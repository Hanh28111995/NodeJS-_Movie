import redisClient from "../config/Redis.js";
const HOLD_TTL_SECONDS = 15 * 60; // 15 phút, bằng cửa sổ giữ

export const tryHoldCoupon = async (code, userId) => {
  const ok = await redisClient.set(`hold:coupon:${code}:${userId}`, "1", "NX", "EX", HOLD_TTL_SECONDS);
  return ok === "OK";
};

export const releaseCouponHold = async (code, userId) =>
  redisClient.del(`hold:coupon:${code}:${userId}`);