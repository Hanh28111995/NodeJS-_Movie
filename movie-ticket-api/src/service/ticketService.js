import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";
import Notification from "../model/userCartNotificationModel.js";

// Helper function: Tạo message dựa vào ticketStatus
const getNotificationMessage = (ticketStatus) => {
  const messages = {
    pending: "Bạn đã đặt vé thành công",
    confirmed: "Thanh toán thành công",
    cancelled: "Bạn đã hủy vé",
  };
  return messages[ticketStatus] || "Vé được cập nhật";
};

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

  const newTicket = await InforTicket.create(ticketData);

  // Tạo notification mới khi ticket được tạo
  await Notification.create({
    id_ticket: newTicket._id,
    id_user: ticketData.user_id,
    status: false, // unread
    ticketStatus: "pending",
    note: getNotificationMessage("pending"),
  });

  return newTicket;
};

export const deleteTicket = async (id) => {
  return await InforTicket.findByIdAndDelete(id);
};

export const getUserTickets = async (userIdentifier, options = {}) => {
  const { populateUser = false } = options;

  let query = {};
  if (Array.isArray(userIdentifier)) {
    query.user_id = { $in: userIdentifier };
  } else {
    query.user_id = userIdentifier;
  }

  // Tối ưu: Chỉ lấy các trường cần thiết cho danh sách vé
  let ticketQuery = InforTicket.find(query)
    .select("startTime seatName paymentStatus paymentMethod transactionId id_movie id_theater user_id createdAt")
    .sort({ createdAt: -1 });

  if (populateUser) {
    ticketQuery = ticketQuery.populate("user_id", "username email userphone");
  }

  return await ticketQuery.lean();
};

// Backward compatibility - for single user without options
export const getTicketsByUserIds = async (userIds) => {
  return await getUserTickets(userIds, { populateUser: true });
};

export const confirmTicketPayment = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");
  
  await InforTicket.updateOne(
    { _id: ticketId },
    { $set: { paymentStatus: "Completed" } }
  );

  // Lấy lại ticket sau khi update để trả về
  const updatedTicket = await InforTicket.findById(ticketId);

  // Update notification khi ticket được confirm
  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "confirmed",
      status: false, // unread
      note: getNotificationMessage("confirmed"),
    },
    { upsert: true }
  );

  return updatedTicket;
};

export const cancelTicket = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  await InforTicket.updateOne(
    { _id: ticketId },
    { $set: { paymentStatus: "Failed" } }
  );

  // Release ghế về isBooked = false
  if (ticket.showtime_id && ticket.seatName?.length > 0) {
    const seatNumbers = ticket.seatName.map(s => s.seatNumber || s);
    await Showtime.updateOne(
      { _id: ticket.showtime_id },
      { $set: { "seats.$[seat].isBooked": false } },
      { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] }
    );
  }

  // Update notification khi ticket được cancel
  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "cancelled",
      status: false, // unread
      note: getNotificationMessage("cancelled"),
    },
    { upsert: true }
  );

  return await InforTicket.findById(ticketId);
};
