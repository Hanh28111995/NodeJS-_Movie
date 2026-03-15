import InforTicket from "../../model/inforTicketModel.js";
import User from "../../model/userModel.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

/**
 * @desc Nhân viên tìm kiếm vé theo Username hoặc Email khách hàng
 */
export const searchTicketByStaff = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return sendError(res, "Vui lòng cung cấp từ khóa tìm kiếm", 400);
  }

  // 1. Tìm User theo username hoặc email
  const user = await User.findOne({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } }
    ]
  });

  if (!user) {
    return sendError(res, "Không tìm thấy người dùng", 404);
  }

  // 2. Tìm toàn bộ vé của User đó
  const tickets = await InforTicket.find({ user_id: user._id.toString() });

  return sendSuccess(res, "Tìm thấy danh sách vé thành công", {
    user: {
      username: user.username,
      email: user.email,
      avatar: user.avatar
    },
    tickets
  });
});

/**
 * @desc Lấy toàn bộ danh sách vé (Dành cho nhân viên quản lý)
 */
export const getAllTicketsByStaff = asyncHandler(async (req, res) => {
  const tickets = await InforTicket.find().sort({ createdAt: -1 });
  return sendSuccess(res, "Lấy toàn bộ danh sách vé thành công", tickets);
});
