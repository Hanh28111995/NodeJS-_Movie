import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import userRepository from "../../repository/userRepository.js";
/**
 * @desc Get current user's profile
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    return sendError(res, "Unauthorized or missing user ID", 401);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  return sendSuccess(res, "Profile retrieved successfully", { user });
});

/**
 * @desc Update current user's profile
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.user?._id;
  if (!userId) {
    return sendError(res, "Unauthorized or missing user ID", 401);
  }

  const { username, userphone, avatar } = req.body;

  const updatedUser = await userRepository.updateById(
    userId,
    { $set: { username, userphone, avatar } }
  );

  if (!updatedUser) {
    return sendError(res, "User not found to update", 404);
  }

  return sendSuccess(res, "Profile updated successfully", updatedUser);
});