import { sendSuccess } from "../../helper/client.js";
import User from "../../model/userModel.js";
import * as ticketService from "../../service/ticketService.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getMyTicketHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { username } = req.query;

  // Nếu có query username, kiểm tra xem có match với user hiện tại không
  if (username) {
    const user = await User.findById(userId).select("username");
    if (!user || !user.username.toLowerCase().includes(username.toLowerCase())) {
      return sendSuccess(res, "No tickets found for this username", { tickets: [] });
    }
  }

  // Sử dụng ticketService để lấy lịch sử vé của user hiện tại
  const tickets = await ticketService.getUserTickets(userId);

  return sendSuccess(res, "Ticket history retrieved successfully", { tickets });
});