

import redisClient from "../config/Redis.js";
import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";

const EXPIRY_MS = 0.5 * 60 * 60 * 1000; // 30 phút

/**
 * @desc Lazy cleanup — gọi khi getShowtimeById hoặc thao tác liên quan, dọn vé Pending quá hạn
 */
export const cleanupExpiredTicketsByShowtime = async (showtimeId) => {
  const expiredBefore = new Date(Date.now() - EXPIRY_MS);

  const expiredTickets = await InforTicket.find({
    showtime_id: showtimeId,
    paymentStatus: "Pending",
    createdAt: { $lt: expiredBefore },
  });

  if (expiredTickets.length === 0) return;

  const seatNumbersToRelease = expiredTickets
    .flatMap(ticket => ticket.seatName)
    .map(s => (typeof s === "object" ? s.seatNumber : s))
    .filter(Boolean);

  // Giải phóng ghế trên Showtime
  await Showtime.updateOne(
    { _id: showtimeId },
    { $set: { "seats.$[seat].isBooked": false } },
    { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbersToRelease } }] }
  );

  // Đổi trạng thái vé thành Failed
  await InforTicket.updateMany(
    { _id: { $in: expiredTickets.map(t => t._id) } },
    { $set: { paymentStatus: "Failed" } }
  );

  // Xóa Redis Lock tương ứng (phòng hờ kẹt lock)
  for (const seatNum of seatNumbersToRelease) {
    const lockKey = `lock:seat:${showtimeId}:${seatNum}`;
    await redisClient.del(lockKey).catch(() => {});
  }

  console.log(`[Lazy Cleanup] Giải phóng ${seatNumbersToRelease.length} ghế cho suất chiếu ${showtimeId}.`);
};

/**
 * @desc Global cleanup — quét toàn bộ hệ thống tìm vé Pending quá hạn (gọi từ cron endpoint/cron job)
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
      if (ticket.showtime_id && ticket.seatName?.length > 0) {
        const seatNumbers = ticket.seatName
          .map(s => (typeof s === "object" ? s.seatNumber : s))
          .filter(Boolean);

        if (seatNumbers.length > 0) {
          // Giải phóng ghế trong Showtime tương ứng
          await Showtime.updateOne(
            { _id: ticket.showtime_id },
            { $set: { "seats.$[seat].isBooked": false } },
            { arrayFilters: [{ "seat.seatNumber": { $in: seatNumbers } }] }
          );

          // Xóa Redis Lock khớp với cấu trúc lúc createTicket
          for (const seatNum of seatNumbers) {
            const lockKey = `lock:seat:${ticket.showtime_id}:${seatNum}`;
            await redisClient.del(lockKey).catch(() => {});
          }
        }
      } else {
        console.warn(`[Cron] Vé ${ticket._id} thiếu thông tin showtime_id hoặc ghế, không thể giải phóng.`);
      }

      // Cập nhật trạng thái vé thành Failed
      await InforTicket.updateOne(
        { _id: ticket._id },
        { $set: { paymentStatus: "Failed" } }
      );
      
      processedCount++;
    } catch (err) {
      console.error(`[Cron] Lỗi xử lý vé hết hạn ${ticket._id}:`, err.message);
    }
  }

  return {
    message: `Đã xử lý ${processedCount}/${expiredTickets.length} vé hết hạn.`,
    count: processedCount,
  };
};