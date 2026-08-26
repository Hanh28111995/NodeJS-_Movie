import redisClient from "../config/Redis.js";
import Showtime from "../model/showtimeModel.js";
import Notification from "../model/userCartNotificationModel.js";
import userRepository from "../repository/userRepository.js";
import ticketRepository from "../repository/ticketRepository.js";

const getNotificationMessage = (ticketStatus) => {
  const messages = {
    Pending: "You have successfully booked the ticket",
    Completed: "Payment successful",
    Failed: "Your ticket has been cancelled",
  };
  return messages[ticketStatus] || "Ticket updated";
};

// --- STAFF SERVICES ---

export const searchTickets = async (query) => {
  const { keyword } = query;
  if (!keyword) return [];
  return await ticketRepository.searchWithUserPopulate(keyword);
};

export const createQuickCustomer = async (userData) => {
  const existingUser = await userRepository.findOne({
    $or: [{ email: userData.email }, { userphone: userData.userphone }],
  });
  if (existingUser) return existingUser;

  return await userRepository.create({
    ...userData,
    password: Math.random().toString(36).slice(-8),
    isGuest: true,
  });
};

// --- GENERAL SERVICES ---

export const getAllTickets = async ({
  page = 1,
  limit = 10,
  paymentStatus,
} = {}) => {
  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const skip = (page - 1) * limit;
  const { tickets, total } = await ticketRepository.findAll(
    filter,
    skip,
    limit,
  );

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const createTicket = async (ticketData) => {
  if (!ticketData.transactionId) {
    ticketData.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  const showtimeId = ticketData.showtime_id;
  const seatNumbers = ticketData.seatName?.map((s) => s.seatNumber || s) || [];

  if (showtimeId && seatNumbers.length > 0) {
    const lockKeys = seatNumbers.map(
      (seat) => `lock:seat:${showtimeId}:${seat}`,
    );
    const acquiredLocks = [];

    try {
      for (const lockKey of lockKeys) {
        const acquired = await redisClient.set(lockKey, "locked", {
          NX: true,
          EX: 5,
        });

        if (acquired !== "OK") {
          const seatNum = lockKey.split(":").pop();
          const error = new Error(
            `Seat ${seatNum} is currently being processed by another user, please choose another seat!`,
          );
          error.statusCode = 400;
          throw error;
        }
        acquiredLocks.push(lockKey);
      }

      const result = await Showtime.updateOne(
        {
          _id: showtimeId,
          seats: {
            $not: {
              $elemMatch: { seatNumber: { $in: seatNumbers }, isBooked: true },
            },
          },
        },
        { $set: { "seats.$[seat].isBooked": true } },
        { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] },
      );

      if (result.matchedCount === 0) {
        const error = new Error(
          "One or more seats have already been booked by someone else",
        );
        error.statusCode = 400;
        throw error;
      }
    } finally {
      for (const lockKey of acquiredLocks) {
        await redisClient.del(lockKey);
      }
    }
  }

  const newTicket = await ticketRepository.create(ticketData);

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
  const ticket = await ticketRepository.findByIdRaw(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  await ticketRepository.updateOneByCondition(
    { _id: ticketId },
    { $set: { paymentStatus: "Completed" } },
  );

  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "Completed",
      status: false,
      note: getNotificationMessage("Completed"),
    },
    { upsert: true },
  );

  return await ticketRepository.findById(ticketId);
};

export const cancelTicket = async (ticketId) => {
  const ticket = await ticketRepository.findByIdRaw(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  if (ticket.paymentStatus === "Failed") return ticket;

  await ticketRepository.updateOneByCondition(
    { _id: ticketId },
    { $set: { paymentStatus: "Failed" } },
  );

  if (ticket.showtime_id && ticket.seatName?.length > 0) {
    const seatNumbers = ticket.seatName.map((s) => s.seatNumber || s);
    await Showtime.updateOne(
      { _id: ticket.showtime_id },
      { $set: { "seats.$[seat].isBooked": false } },
      { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] },
    );
  }

  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "Failed",
      status: false,
      note: getNotificationMessage("Failed"),
    },
    { upsert: true },
  );

  return await ticketRepository.findById(ticketId);
};

export const getTicketById = async (ticketId) => {
  const ticket = await ticketRepository.findById(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }
  return ticket;
};

export const completeTicket = async (ticketId) => {
  const ticket = await ticketRepository.findByIdRaw(ticketId);
  if (!ticket) {
    const error = new Error("Ticket not found");
    error.statusCode = 404;
    throw error;
  }

  await ticketRepository.updateOneByCondition(
    { _id: ticketId },
    { $set: { paymentStatus: "Completed" } },
  );

  await Notification.findOneAndUpdate(
    { id_ticket: ticketId },
    {
      ticketStatus: "Completed",
      status: false,
      note: getNotificationMessage("Completed"),
    },
    { upsert: true },
  );

  return await ticketRepository.findById(ticketId);
};

export const updateTicket = async (id, updateData) => {
  const updatedTicket = await ticketRepository.updateById(id, updateData);
  if (!updatedTicket) {
    const error = new Error("Ticket not found to update");
    error.statusCode = 404;
    throw error;
  }
  return updatedTicket;
};

export const deleteTicket = async (id) => {
  const deletedTicket = await ticketRepository.deleteById(id);
  if (!deletedTicket) {
    const error = new Error("Ticket not found to delete");
    error.statusCode = 404;
    throw error;
  }
  return deletedTicket;
};
