import * as favoriteRepository from "../repository/favoriteRepository.js";
import { sendError, sendSuccess, sendServerError } from "../helper/client.js";

const tierOf = (points) =>
  points >= 10000 ? "Platinum" : points >= 5000 ? "Gold" : points >= 1000 ? "Silver" : "Bronze";

const getOrCreate = async (userId) =>
  (await favoriteRepository.getByUserId(userId)) ||
  favoriteRepository.createProfile(userId);

export const getProfile = async (res, userId) => {
  try {
    const profile = await getOrCreate(userId);
    return sendSuccess(res, "Lấy hồ sơ thành công", profile);
  } catch { return sendServerError(res); }
};

export const toggleFavorite = async (res, userId, field, itemId) => {
  try {
    await getOrCreate(userId);
    const profile = await favoriteRepository.toggleArrayItem(userId, field, itemId);
    return sendSuccess(res, "Cập nhật yêu thích thành công", profile);
  } catch { return sendServerError(res); }
};

export const earnPoints = async (userId, points) => {
  // gọi từ orderService khi đơn hoàn tất — không trả res
  const profile = await favoriteRepository.addPoints(userId, points);
  if (profile) {
    const tier = tierOf(profile.loyaltyPoints);
    if (tier !== profile.membershipLevel)
      await favoriteRepository.updateMembershipLevel(userId, tier);
  }
  return profile;
};