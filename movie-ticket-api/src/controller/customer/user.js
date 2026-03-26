import User from "../../model/userModel.js";
import { sendSuccess } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

/**
 * @desc Lấy thông tin cá nhân của người dùng hiện tại
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("-password -refreshToken");
  return sendSuccess(res, "Lấy thông tin cá nhân thành công", { user });
});

/**
 * @desc Cập nhật thông tin cá nhân
 */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { username, userphone, avatar } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { username, userphone, avatar } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return sendSuccess(res, "Cập nhật thông tin cá nhân thành công", updatedUser);
});
