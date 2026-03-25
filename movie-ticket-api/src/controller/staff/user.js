import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import * as userService from "../../service/userService.js";

/**
 * @desc Staff tìm kiếm customer theo username hoặc email
 */
export const searchCustomer = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  if (!q) return sendError(res, "Vui lòng cung cấp từ khóa tìm kiếm", 400);
  const result = await userService.getAllUsers({ page: Number(page), limit: Number(limit), search: q });
  return sendSuccess(res, "Tìm kiếm khách hàng thành công", result);
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
