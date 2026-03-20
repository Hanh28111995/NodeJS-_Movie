import User from "../../model/userModel.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

/**
 * @desc Staff tìm kiếm customer theo username, email hoặc phone
 */
export const searchCustomer = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) return sendError(res, "Vui lòng cung cấp từ khóa tìm kiếm", 400);

  const users = await User.find({
    role: "customer",
    $or: [
      { username: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { userphone: { $regex: q, $options: "i" } },
    ],
  }).select("-password -refreshToken").lean();

  return sendSuccess(res, "Tìm kiếm khách hàng thành công", users);
});

/**
 * @desc Staff cập nhật thông tin customer
 */
export const editOneCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, userphone, avatar } = req.body;

  const user = await User.findOne({ _id: id, role: "customer" });
  if (!user) return sendError(res, "Không tìm thấy khách hàng", 404);

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { username, email, userphone, avatar } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return sendSuccess(res, "Cập nhật thông tin khách hàng thành công", updated);
});
