import SeatType from "../model/seatTypeModel.js";

/**
 * @desc Tự động tạo danh sách ghế dựa trên số hàng và số cột
 * @param {number} rows Số hàng (A, B, C...)
 * @param {number} cols Số cột (1, 2, 3...)
 * @returns {Promise<Array>} Danh sách ghế đã được khởi tạo
 */
export const generateSeats = async (rows, cols) => {
  const seats = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Lấy SeatType mặc định (Standard) để gán cho ghế mới
  let defaultSeatType = await SeatType.findOne({ name: "Standard" });
  
  // Nếu chưa có SeatType nào, tạo tạm một cái để không bị lỗi
  if (!defaultSeatType) {
    defaultSeatType = await SeatType.create({
      name: "Standard",
      price: 50000,
      description: "Ghế tiêu chuẩn"
    });
  }

  for (let i = 0; i < rows; i++) {
    const rowLabel = alphabet[i];
    for (let j = 1; j <= cols; j++) {
      seats.push({
        seatNumber: `${rowLabel}${j}`,
        seatType: defaultSeatType._id,
        isBooked: false,
      });
    }
  }
  return seats;
};
