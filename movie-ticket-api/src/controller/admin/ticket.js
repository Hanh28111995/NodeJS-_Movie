import { sendSuccess } from "../../helper/client.js";
import * as ticketService from "../../service/ticketService.js";
import asyncHandler from "../../util/asyncHandler.js";

// 1. Lấy danh sách vé (có phân trang và lọc theo paymentStatus)
export const getAllTickets = async ({ page, limit, paymentStatus }) => {
  const skip = (page - 1) * limit;

  // Tạo điều kiện lọc nếu có paymentStatus
  const filter = {};
  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  const tickets = await Ticket.find(filter).skip(skip).limit(limit);
  const total = await Ticket.countDocuments(filter);

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 2. Lấy thông tin chi tiết vé theo ID
export const getTicketById = async (id) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) {
    throw new Error("Không tìm thấy vé");
  }
  return ticket;
};

// 3. Tạo mới một vé
export const createTicket = async (ticketData) => {
  const newTicket = await Ticket.create(ticketData);
  return newTicket;
};

// 4. Cập nhật thông tin vé theo ID
export const updateTicket = async (id, updateData) => {
  const updatedTicket = await Ticket.findByIdAndUpdate(id, updateData, {
    new: true, // Trả về dữ liệu sau khi đã cập nhật
    runValidators: true,
  });

  if (!updatedTicket) {
    throw new Error("Không tìm thấy vé để cập nhật");
  }

  return updatedTicket;
};

// 5. Xóa vé theo ID
export const deleteTicket = async (id) => {
  const deletedTicket = await Ticket.findByIdAndDelete(id);
  if (!deletedTicket) {
    throw new Error("Không tìm thấy vé để xóa");
  }
  return deletedTicket;
};

// 6. Hủy vé (Cập nhật trạng thái vé thành đã hủy)
export const cancelTicket = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new Error("Không tìm thấy vé cần hủy");
  }
  
  ticket.status = "CANCELLED";
  await ticket.save();

  return ticket;
};
