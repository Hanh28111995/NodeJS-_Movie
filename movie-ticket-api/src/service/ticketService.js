import redisClient from "../config/Redis.js";
import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";
import Notification from "../model/userCartNotificationModel.js";

const getNotificationMessage = (ticketStatus) => {
  const messages = {
    Pending: "Bạn đã đặt vé thành công",
    Completed: "Thanh toán thành công",
    Failed: "Bạn đã hủy vé",    
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

  const showtimeId = ticketData.showtime_id;
  const seatNumbers = ticketData.seatName?.map(s => s.seatNumber || s) || [];

  if (showtimeId && seatNumbers.length > 0) {
    // 1. Tạo các khóa Redis cho từng ghế đang muốn đặt (Ví dụ giữ khóa trong 5 giây)
    const lockKeys = seatNumbers.map(seat => `lock:seat:${showtimeId}:${seat}`);
    const acquiredLocks = [];

    try {
      // Thử acquire lock cho tất cả các ghế khách chọn
      for (const lockKey of lockKeys) {
        const acquired = await redisClient.set(lockKey, "locked", {
          NX: true,
          EX: 5, // Khóa tồn tại trong 5 giây để hoàn tất transaction
        });

        if (acquired !== "OK") {
          // Nếu có bất kỳ ghế nào đang bị người khác giữ khóa, dừng lại ngay
          throw new Error(`Ghế ${lockKey.split(':').pop()} đang có người khác thao tác thanh toán, vui lòng chọn ghế khác!`);
        }
        acquiredLocks.push(lockKey);
      }

      // 2. Sau khi đã giữ được khóa trên Redis, tiến hành kiểm tra & cập nhật MongoDB như logic cũ của bạn
      const result = await Showtime.updateOne(
        {
          _id: showtimeId,
          "seats": { $not: { $elemMatch: { seatNumber: { $in: seatNumbers }, isBooked: true } } }
        },
        { $set: { "seats.$[seat].isBooked": true } },
        { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] }
      );

      if (result.matchedCount === 0) {
        throw new Error("Một hoặc nhiều ghế đã được đặt bởi người khác");
      }

    } finally {
      // 3. Quan trọng: Dù thành công hay thất bại, bắt buộc phải giải phóng khóa Redis để nhường chỗ
      for (const lockKey of acquiredLocks) {
        await redisClient.del(lockKey);
      }
    }
  }

  const newTicket = await InforTicket.create(ticketData);

  // Tạo thông báo
  await Notification.create({
    id_ticket: newTicket._id,
    id_user: ticketData.user_id,
    status: false,
    ticketStatus: "Pending",
    note: getNotificationMessage("Pending"),
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
      ticketStatus: "Completed",
      status: false,
      note: getNotificationMessage("Completed"),
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
      ticketStatus: "Failed",
      status: false,
      note: getNotificationMessage("Failed"),
    },
    { upsert: true }
  );

  return await InforTicket.findById(ticketId).lean();
};

export const getTicketById = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId)    
    .populate("id_movie", "title")
    .populate("id_theater", "name")
    .lean();

  if (!ticket) {
    return sendError( ticket,"Vé không tồn tại", 401);
  }

  return ticket;
};

export const completeTicket = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Vé không tồn tại");

  await InforTicket.updateOne(
    { _id: ticketId },
    { $set: { paymentStatus: "Completed" } }
  );

  // Update notification cho trạng thái thanh toán online thành công
  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "Completed",
      status: false,
      note: getNotificationMessage("Completed"),
    },
    { upsert: true }
  );

  return await InforTicket.findById(ticketId).lean();
};

export const updateTicket = async (id, updateData) => {
  const updatedTicket = await InforTicket.findByIdAndUpdate(id, updateData, {
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
  const deletedTicket = await InforTicket.findByIdAndDelete(id);
  if (!deletedTicket) {
    throw new Error("Không tìm thấy vé để xóa");
  }
  return deletedTicket;
};




