import InforTicket from "../../model/inforTicketModel.js";
import User from "../../model/userModel.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import bcrypt from "bcryptjs";
import * as ticketService from "../../service/ticketService.js";

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

/**
 * @desc Staff tạo tài khoản customer tại quầy
 */
export const createCustomerByStaff = asyncHandler(async (req, res) => {
  const { username, email, password, userphone } = req.body;

  if (!username || !email) return sendError(res, "username và email là bắt buộc", 400);

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) return sendError(res, "Username hoặc Email đã tồn tại", 400);

  const hashedPassword = await bcrypt.hash(password || "123456", 10);
  const newUser = await User.create({
    username,
    email,
    userphone: userphone || "",
    password: hashedPassword,
    role: "customer",
  });

  return sendSuccess(res, "Tạo tài khoản khách hàng thành công", {
    _id: newUser._id,
    username: newUser.username,
    email: newUser.email,
    userphone: newUser.userphone,
  });
});

/**
 * @desc Staff book vé cho customer (dùng chung ticketService với customer)
 * Khác customer ở chỗ: user_id lấy từ body thay vì req.user.id
 */
export const bookForCustomer = asyncHandler(async (req, res) => {
  const { user_id, ...ticketData } = req.body;
  if (!user_id) return sendError(res, "user_id là bắt buộc", 400);

  const user = await User.findById(user_id).lean();
  if (!user) return sendError(res, "Không tìm thấy khách hàng", 404);

  const newTicket = await ticketService.createTicket({ ...ticketData, user_id });
  return sendSuccess(res, "Đặt vé cho khách hàng thành công", newTicket);
});
