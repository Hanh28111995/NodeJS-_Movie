import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";

/**
 * @desc Xử lý dọn dẹp vé hết hạn cho một suất chiếu cụ thể (Lazy Cleanup)
 * @param {string} movieId 
 * @param {string} theaterId 
 * @param {Date} startTime 
 */
export const cleanupExpiredTicketsByShowtime = async (movieId, theaterId, startTime) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // 1. Tìm các vé Pending của suất chiếu này đã quá 10 phút
  const expiredTickets = await InforTicket.find({
    id_movie: movieId,
    id_theater: theaterId,
    startTime: startTime,
    paymentStatus: "Pending",
    createdAt: { $lt: tenMinutesAgo },
  });

  if (expiredTickets.length === 0) return;

  // 2. Lấy danh sách tất cả các ghế cần giải phóng
  const seatsToRelease = expiredTickets.flatMap(ticket => ticket.seatName);

  // 3. Cập nhật Showtime một lần duy nhất để giải phóng tất cả ghế
  const showtime = await Showtime.findOne({
    movie: movieId,
    theater: theaterId,
    startTime: startTime,
  });

  if (showtime) {
    showtime.seats = showtime.seats.map(seat => {
      if (seatsToRelease.includes(seat.seatNumber)) {
        return { ...seat.toObject(), isBooked: false };
      }
      return seat;
    });
    await showtime.save();
  }

  // 4. Cập nhật trạng thái vé sang Failed
  await InforTicket.updateMany(
    { _id: { $in: expiredTickets.map(t => t._id) } },
    { $set: { paymentStatus: "Failed" } }
  );

  console.log(`Lazy Cleanup: Đã giải phóng ${seatsToRelease.length} ghế cho suất chiếu.`);
};

/**
 * @desc Tự động quét và xử lý các vé chưa thanh toán quá hạn (Toàn bộ hệ thống)
 */
export const cleanupExpiredTickets = async () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  // 1. Tìm các vé quá hạn
  const expiredTickets = await InforTicket.find({
    paymentStatus: "Pending",
    createdAt: { $lt: tenMinutesAgo },
  });

  if (expiredTickets.length === 0) {
    return { message: "Không có vé nào hết hạn cần xử lý." };
  }

  let processedCount = 0;

  for (const ticket of expiredTickets) {
    try {
      // 2. Tìm Showtime tương ứng
      const showtime = await Showtime.findOne({
        movie: ticket.id_movie,
        theater: ticket.id_theater,
        startTime: ticket.startTime,
      });

      if (showtime) {
        // Giải phóng ghế
        const updatedSeats = showtime.seats.map((seat) => {
          if (ticket.seatName.includes(seat.seatNumber)) {
            return { ...seat.toObject(), isBooked: false };
          }
          return seat;
        });

        showtime.seats = updatedSeats;
        await showtime.save();
      }

      // 3. Cập nhật trạng thái vé
      ticket.paymentStatus = "Failed";
      await ticket.save();
      
      processedCount++;
    } catch (err) {
      console.error(`Lỗi khi xử lý vé ${ticket._id}:`, err.message);
    }
  }

  return { 
    message: `Đã xử lý thành công ${processedCount}/${expiredTickets.length} vé hết hạn.`,
    count: processedCount 
  };
};
