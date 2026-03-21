import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";

const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 tiếng

/**
 * @desc Lazy cleanup — gọi khi getShowtimeById, dọn vé Pending quá hạn của 1 suất chiếu
 */
export const cleanupExpiredTicketsByShowtime = async (movieId, theaterId, startTime) => {
  const expiredBefore = new Date(Date.now() - EXPIRY_MS);
  const startTimeStr = startTime instanceof Date ? startTime.toISOString() : startTime;

  const expiredTickets = await InforTicket.find({
    id_movie: movieId,
    id_theater: theaterId,
    startTime: startTimeStr,
    paymentStatus: "Pending",
    createdAt: { $lt: expiredBefore },
  });

  if (expiredTickets.length === 0) return;

  const seatNumbersToRelease = expiredTickets
    .flatMap(ticket => ticket.seatName)
    .map(s => (typeof s === "object" ? s.seatNumber : s))
    .filter(Boolean);

  await Showtime.updateOne(
    { id_movie: movieId, theater: theaterId, startTime: startTime },
    { $set: { "seats.$[seat].isBooked": false } },
    { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbersToRelease } }] }
  );

  await InforTicket.updateMany(
    { _id: { $in: expiredTickets.map(t => t._id) } },
    { $set: { paymentStatus: "Failed" } }
  );

  console.log(`[Lazy Cleanup] Giải phóng ${seatNumbersToRelease.length} ghế.`);
};

/**
 * @desc Global cleanup — quét toàn bộ vé Pending quá hạn (gọi từ cron endpoint)
 */
export const cleanupExpiredTickets = async () => {
  const expiredBefore = new Date(Date.now() - EXPIRY_MS);

  const expiredTickets = await InforTicket.find({
    paymentStatus: "Pending",
    createdAt: { $lt: expiredBefore },
  });

  if (expiredTickets.length === 0) {
    return { message: "Không có vé nào hết hạn cần xử lý." };
  }

  let processedCount = 0;

  for (const ticket of expiredTickets) {
    try {
      const seatNumbers = ticket.seatName
        .map(s => (typeof s === "object" ? s.seatNumber : s))
        .filter(Boolean);

      await Showtime.updateOne(
        { id_movie: ticket.id_movie, theater: ticket.id_theater, startTime: ticket.startTime },
        { $set: { "seats.$[seat].isBooked": false } },
        { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] }
      );

      ticket.paymentStatus = "Failed";
      await ticket.save();
      processedCount++;
    } catch (err) {
      console.error(`[Cron] Lỗi vé ${ticket._id}:`, err.message);
    }
  }

  return {
    message: `Đã xử lý ${processedCount}/${expiredTickets.length} vé hết hạn.`,
    count: processedCount,
  };
};
