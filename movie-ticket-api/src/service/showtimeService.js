import Showtime from "../model/showtimeModel.js";
import Theater from "../model/theaterModel.js";
import Cinema from "../model/cinemaModel.js";
import SeatType from "../model/seatTypeModel.js";

/**
 * Tạo 1 showtime. Throw Error nếu có vấn đề.
 * @returns {Object} showtime vừa tạo
 */
export const createOneShowtime = async ({ theaterId, movieId, startTime }) => {
  const theater = await Theater.findById(theaterId).lean();
  if (!theater) throw new Error("Không tìm thấy phòng chiếu");

  const cinema = await Cinema.findOne({ cinemaName: theater.cinemaName }).lean();
  if (!cinema) throw new Error("Không tìm thấy cụm rạp có phòng chiếu này");

  if (!theater.seats?.length) throw new Error("Phòng chiếu chưa có cấu hình ghế mặc định");

  const isExisted = await Showtime.findOne({ theater: theaterId, startTime });
  if (isExisted) throw new Error("Khung giờ này tại phòng chiếu đã có suất chiếu khác");

  const seatTypeIds = [...new Set(theater.seats.map(s => s.seatType?.toString()).filter(Boolean))];
  const seatTypes = await SeatType.find({ _id: { $in: seatTypeIds } }).lean();
  const seatTypeMap = Object.fromEntries(seatTypes.map(st => [st._id.toString(), st.price]));

  const seats = theater.seats.map(s => ({
    seatNumber: s.seatNumber,
    seatType: s.seatType,
    price: seatTypeMap[s.seatType?.toString()] ?? 0,
    isBooked: false,
  }));

  return await Showtime.create({ id_movie: movieId, theater: theaterId, cinema: cinema._id, startTime, seats });
};
