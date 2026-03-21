import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";

export const getAllTickets = async ({ page = 1, limit = 10, paymentStatus } = {}) => {
  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    InforTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    InforTicket.countDocuments(filter),
  ]);

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getTicketById = async (id) => {
  return await InforTicket.findById(id).lean();
};

export const createTicket = async (ticketData) => {
  if (!ticketData.transactionId) {
    ticketData.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Kiểm tra và lock ghế trước khi tạo vé (tránh race condition)
  if (ticketData.showtime_id && ticketData.seatName?.length > 0) {
    const seatNumbers = ticketData.seatName.map(s => s.seatNumber || s);

    // Atomic check: chỉ update nếu TẤT CẢ ghế đều chưa booked
    const result = await Showtime.updateOne(
      {
        _id: ticketData.showtime_id,
        "seats": { $not: { $elemMatch: { seatNumber: { $in: seatNumbers }, isBooked: true } } }
      },
      { $set: { "seats.$[seat].isBooked": true } },
      { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] }
    );

    if (result.matchedCount === 0) {
      throw new Error("Một hoặc nhiều ghế đã được đặt bởi người khác");
    }
  }

  return await InforTicket.create(ticketData);
};

export const deleteTicket = async (id) => {
  return await InforTicket.findByIdAndDelete(id);
};

export const getUserTickets = async (userId) => {
  return await InforTicket.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
};

export const confirmTicketPayment = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");
  
  ticket.paymentStatus = "Completed";
  return await ticket.save();
};

export const cancelTicket = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  ticket.paymentStatus = "Failed";
  await ticket.save();

  // Release ghế về isBooked = false
  if (ticket.showtime_id && ticket.seatName?.length > 0) {
    const seatNumbers = ticket.seatName.map(s => s.seatNumber || s);
    await Showtime.updateOne(
      { _id: ticket.showtime_id },
      { $set: { "seats.$[seat].isBooked": false } },
      { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] }
    );
  }

  return ticket;
};
