import { sendSuccess, sendError } from "../../helper/client.js";
import User from "../../model/userModel.js";
import * as ticketService from "../../service/ticketService.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getTicketHistory = asyncHandler(async (req, res) => {
  const { username, email, phone } = req.query;

  // Tạo điều kiện tìm kiếm user
  let userQuery = {};
  if (username) userQuery.username = { $regex: username, $options: "i" };
  if (email) userQuery.email = { $regex: email, $options: "i" };
  if (phone) userQuery.userphone = { $regex: phone, $options: "i" };

  // Nếu không có điều kiện nào, trả về lỗi
  if (Object.keys(userQuery).length === 0) {
    return sendError(res, "Please provide username, email, or phone to search", 400);
  }

  // Tìm user theo điều kiện
  const users = await User.find(userQuery).select("_id username email userphone");

  if (users.length === 0) {
    return sendSuccess(res, "No users found", { tickets: [] });
  }

  // Lấy user IDs
  const userIds = users.map(user => user._id);

  // Sử dụng ticketService để lấy tickets
  const tickets = await ticketService.getUserTickets(userIds, { populateUser: true });

  return sendSuccess(res, "Ticket history retrieved successfully", {
    users: users,
    tickets: tickets
  });
});