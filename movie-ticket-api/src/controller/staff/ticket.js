import InforTicket from "../../model/inforTicketModel.js";
import User from "../../model/userModel.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import bcrypt from "bcryptjs";
import * as ticketService from "../../service/ticketService.js";

// Lấy tất cả vé (Staff view)
export const getAllTicketsByStaff = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const data = await ticketService.getAllTickets({ page, limit, paymentStatus: status });
  return sendSuccess(res, "Lấy danh sách vé thành công", data);
});

// Tìm kiếm vé
export const searchTicketByStaff = asyncHandler(async (req, res) => {
  const tickets = await ticketService.searchTickets(req.query);
  return sendSuccess(res, "Kết quả tìm kiếm", tickets);
});

// Tạo khách hàng mới nhanh
export const createCustomerByStaff = asyncHandler(async (req, res) => {
  const customer = await ticketService.createQuickCustomer(req.body);
  return sendSuccess(res, "Tạo khách hàng thành công", customer);
});

// Staff đặt vé hộ khách
export const bookForCustomer = asyncHandler(async (req, res) => {
  // Logic này dùng chung createTicket nhưng có thể thêm note: "Staff booked"
  const ticketData = { ...req.body, bookingSource: "Staff" };
  const ticket = await ticketService.createTicket(ticketData);
  return sendSuccess(res, "Đặt vé thành công", ticket);
});

// Staff hủy vé cho khách
export const cancelTicket = asyncHandler(async (req, res) => {
  const  ticketId  = req.body._id; // Hoặc req.params tùy validateBody
  const result = await ticketService.cancelTicket(ticketId);
  return sendSuccess(res, "Hủy vé thành công", result);
});

export const confirmTicket = asyncHandler(async (req, res) => {
  const  ticketId  = req.body_id;
  const ticket = await ticketService.confirmTicket(ticketId);
  return sendSuccess(res, "Ticket confirmed successfully", ticket);
});