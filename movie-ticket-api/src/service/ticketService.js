import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";
import Notification from "../model/userCartNotificationModel.js";

const getNotificationMessage = (ticketStatus) => {
  const messages = {
    pending: "Bạn đã đặt vé thành công",
    completed: "Thanh toán thành công",
    cancelled: "Bạn đã hủy vé",    
  };
  return messages[ticketStatus] || "Vé được cập nhật";
};

// --- STAFF SERVICES ---

// SEARCH: Tìm kiếm vé (Staff thường tìm theo TransactionId, Email hoặc SĐT)
export const searchTickets = async (query) => {
  const { keyword } = query;
  const searchFilter = {
    $or: [
      { transactionId: { $regex: keyword, $options: "i" } },
      { "user_id.email": { $regex: keyword, $options: "i" } }, // Nếu đã populate
      { "user_id.userphone": { $regex: keyword, $options: "i" } }
    ]
  };
  
  // Lưu ý: Nếu tìm theo trường của user, cần dùng .lookup hoặc tìm user trước
  return await InforTicket.find().populate({
    path: 'user_id',
    match: { $or: [{ email: { $regex: keyword, $options: "i" } }, { userphone: { $regex: keyword, $options: "i" } }] }
  }).lean();
};

// CREATE CUSTOMER QUICK (Staff tạo user nhanh để đặt vé)
export const createQuickCustomer = async (userData) => {
  const existingUser = await User.findOne({ 
    $or: [{ email: userData.email }, { userphone: userData.userphone }] 
  });
  if (existingUser) return existingUser;

  return await User.create({
    ...userData,
    password: Math.random().toString(36).slice(-8), // Tạo pass ngẫu nhiên
    isGuest: true 
  });
};

// --- GENERAL SERVICES (Cập nhật logic từ trước) ---

export const getAllTickets = async ({ page = 1, limit = 10, paymentStatus } = {}) => {
  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (page - 1) * limit;
  const [tickets, total] = await Promise.all([
    InforTicket.find(filter)
      .populate("user_id", "username email userphone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    InforTicket.countDocuments(filter),
  ]);

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createTicket = async (ticketData) => {
  if (!ticketData.transactionId) {
    ticketData.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  // Khóa ghế (Atomic update)
  if (ticketData.showtime_id && ticketData.seatName?.length > 0) {
    const seatNumbers = ticketData.seatName.map(s => s.seatNumber || s);

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

  // Tạo thông báo
  await Notification.create({
    id_ticket: newTicket._id,
    id_user: ticketData.user_id,
    status: false,
    ticketStatus: "pending",
    note: getNotificationMessage("pending"),
  });

  return newTicket;
};

export const confirmTicket = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Vé không tồn tại");

  await InforTicket.updateOne(
    { _id: ticketId },
    { $set: { paymentStatus: "Completed" } }
  );
  // Update notification
  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "completed",
      status: false,
      note: getNotificationMessage("completed"),
    },
    { upsert: true }
  );

  return await InforTicket.findById(ticketId).lean();
};

export const cancelTicket = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Vé không tồn tại");

  // Nếu vé đã hủy rồi thì không xử lý lại
  if (ticket.paymentStatus === "Failed") return ticket;

  await InforTicket.updateOne(
    { _id: ticketId },
    { $set: { paymentStatus: "Failed" } }
  );

  // Giải phóng ghế
  if (ticket.showtime_id && ticket.seatName?.length > 0) {
    const seatNumbers = ticket.seatName.map(s => s.seatNumber || s);
    await Showtime.updateOne(
      { _id: ticket.showtime_id },
      { $set: { "seats.$[seat].isBooked": false } },
      { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] }
    );
  }

  // Update notification
  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "cancelled",
      status: false,
      note: getNotificationMessage("cancelled"),
    },
    { upsert: true }
  );

  return await InforTicket.findById(ticketId).lean();
};

export const getTicketById = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId)
    .populate("user_id", "username email userphone")
    .lean();

  if (!ticket) {
    return sendError( ticket,"Vé không tồn tại", 401);
  }

  return ticket;
};