import InforTicket from "../model/inforTicketModel.js";
import Showtime from "../model/showtimeModel.js";

/**
 * @desc Tự động quét và xử lý các vé chưa thanh toán quá hạn (10 phút)
 * Logic: 
 * 1. Tìm vé có status 'Pending' và thời gian tạo > 10 phút.
 * 2. Cập nhật lại sơ đồ ghế trong Showtime (isBooked = false).
 * 3. Chuyển trạng thái vé sang 'Failed' hoặc xóa vé.
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
      // 2. Tìm Showtime tương ứng (Dựa trên id_movie, id_theater và startTime)
      // Lưu ý: Nếu có showtime_id trực tiếp trong Ticket sẽ chính xác hơn
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
