import Showtime from "../model/showtimeModel.js";
import Movie from "../model/movieModel.js";
import Theater from "../model/theaterModel.js";
import Cinema from "../model/cinemaModel.js";
import SeatType from "../model/seatTypeModel.js";
import * as cronService from "./cronService.js";

/**
 * Helper: Map thông tin phim vào danh sách suất chiếu
 */
const mapMoviesToShowtimes = async (showtimes) => {
  const movieIds = [...new Set(showtimes.map((st) => st.id_movie?.toString()).filter(Boolean))];
  const movies = await Movie.find({ _id: { $in: movieIds } }).select("_id title banner").lean();
  const movieMap = Object.fromEntries(movies.map((m) => [m._id.toString(), m]));

  return showtimes.map((st) => ({
    ...st,
    id_movie: movieMap[st.id_movie?.toString()] || st.id_movie,
  }));
};

// CREATE ONE
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
  const seatTypeMap = Object.fromEntries(seatTypes.map(st => [st._id.toString(), { price: st.price, color: st.color }]));

  const seats = theater.seats.map(s => ({
    seatNumber: s.seatNumber,
    seatType: s.seatType,
    price: seatTypeMap[s.seatType?.toString()]?.price ?? 0,
    color: seatTypeMap[s.seatType?.toString()]?.color ?? "#cccccc",
    isBooked: false,
  }));

  return await Showtime.create({ 
    id_movie: movieId, 
    theater: theaterId, 
    cinema: cinema._id, 
    startTime, 
    seats 
  });
};

// FETCH ALL WITH PAGINATION
export const fetchAllShowtimes = async (page, limit) => {
  const skip = (page - 1) * limit;
  
  const [showtimes, total] = await Promise.all([
    Showtime.find()
      .populate("cinema")
      .populate("theater", "-seats") // Tối ưu performance
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Showtime.countDocuments(),
  ]);

  const result = await mapMoviesToShowtimes(showtimes);
  return { result, total };
};

// FETCH ONE BY ID (Có tích hợp cleanup vé hết hạn)
export const fetchShowtimeById = async (id) => {
  const showtime = await Showtime.findById(id)
    .populate("cinema")
    .populate("theater", "-seats")
    .lean();

  if (!showtime) return null;

  const movie = await Movie.findById(showtime.id_movie).select("_id title").lean();

  // Gọi service dọn dẹp các vé giữ chỗ quá hạn trước khi trả về data
  await cronService.cleanupExpiredTicketsByShowtime(
    showtime.id_movie?.toString(),
    showtime.theater._id.toString(),
    showtime.startTime
  );

  // Lấy lại data mới nhất sau khi cleanup
  const updatedShowtime = await Showtime.findById(id)
    .populate("cinema")
    .populate("theater", "-seats")
    .lean();

  return { 
    ...updatedShowtime, 
    id_movie: movie || updatedShowtime.id_movie 
  };
};

// UPDATE
export const updateShowtimeById = async (id, updateData) => {
  // Lưu ý: Nếu update startTime, bạn có thể cần logic check trùng lịch tương tự Create
  const showtime = await Showtime.findByIdAndUpdate(id, updateData, { new: true });
  if (!showtime) throw new Error("Không tìm thấy suất chiếu để cập nhật");
  return showtime;
};

// DELETE
export const removeShowtimeById = async (id) => {
  const result = await Showtime.findByIdAndDelete(id);
  if (!result) throw new Error("Không tìm thấy suất chiếu để xóa");
  return result;
};

// FETCH UPCOMING
export const fetchUpcomingShowtimes = async () => {
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gt: now } })
    .select("_id startTime theater id_movie")
    .populate("theater", "theaterName branch")
    .sort({ startTime: 1 })
    .lean();

  return await mapMoviesToShowtimes(showtimes);
};

// FETCH TODAY (UTC+7)
export const fetchTodayShowtimes = async () => {
  const VN_OFFSET = 7 * 60 * 60 * 1000;
  const nowVN = new Date(Date.now() + VN_OFFSET);

  // Tính toán thời điểm bắt đầu và kết thúc ngày theo giờ VN rồi quy đổi về UTC
  const startUTC = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()) - VN_OFFSET);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

  const showtimes = await Showtime.find({
    startTime: { $gte: startUTC, $lt: endUTC },
  })
    .select("_id startTime theater id_movie")
    .sort({ startTime: 1 })
    .lean();
    
  return showtimes;
};