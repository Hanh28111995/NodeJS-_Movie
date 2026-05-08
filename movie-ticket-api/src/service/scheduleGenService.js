import ScheduleConfig from "../model/scheduleConfigModel.js";
import Showtime from "../model/showtimeModel.js";
import Theater from "../model/theaterModel.js";
import Cinema from "../model/cinemaModel.js";
import SeatType from "../model/seatTypeModel.js";
import Movie from "../model/movieModel.js";
import mongoose from "mongoose";

const VN_OFFSET = 7 * 60 * 60 * 1000;

export const getConfig = async () => {
  return await ScheduleConfig.findOne().lean();
};

export const createConfig = async ({ movie_ids, timeSlots, theaters, scheduleTime }) => {
  const existing = await ScheduleConfig.findOne();
  if (existing) throw new Error("Đã có cấu hình, dùng /update để cập nhật");
  return await ScheduleConfig.create({ movie_ids, timeSlots, theaters, scheduleTime, isActive: true });
};

export const updateConfig = async ({ movie_ids, timeSlots, theaters, scheduleTime, isActive }) => {
  const config = await ScheduleConfig.findOneAndUpdate(
    {},
    { movie_ids, timeSlots, theaters, scheduleTime, ...(isActive !== undefined && { isActive }) },
    { new: true }
  );
  if (!config) throw new Error("Chưa có cấu hình, dùng /create để tạo mới");
  return config;
};


const getVNDayStartUTC = (date) => {
  const vn = new Date(date.getTime() + VN_OFFSET);
  const y = vn.getUTCFullYear();
  const m = vn.getUTCMonth();
  const d = vn.getUTCDate();
  return new Date(Date.UTC(y, m, d) - VN_OFFSET);
};

const slotToStartTime = (date, slot) => {
  if (!date || !slot) return null;  
  const datePart = dayjs(date).format("YYYY-MM-DD");  
  return `${datePart}T${slot}:00.000Z`;
};

export const generate = async () => {
  try {
    // 1. Lấy cấu hình đang hoạt động
    const config = await ScheduleConfig.findOne({ isActive: true }).lean();
    if (!config) {
      return { created: 0, message: "Không tìm thấy cấu hình Active" };
    }

    // 2. Chuyển đổi ID sang ObjectId để đảm bảo truy vấn chính xác
    const movieIds = (config.movie_ids || [])
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
      
    const theaterIds = (config.theaters || [])
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    const timeSlots = config.timeSlots || [];

    // 3. Lấy dữ liệu phim và rạp từ DB
    const [movies, theaters] = await Promise.all([
      Movie.find({ _id: { $in: movieIds } }).select("_id").lean(),
      Theater.find({ _id: { $in: theaterIds } }).lean()
    ]);

    if (movies.length === 0 || theaters.length === 0 || timeSlots.length === 0) {
      return { created: 0, message: "Dữ liệu Phim/Rạp/Slots trống hoặc không khớp ID" };
    }

    // 4. Xác định ngày cần tạo (Hôm nay)
    const todayStart = getVNDayStartUTC(new Date());
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);

    // 5. Kiểm tra các suất chiếu đã có trong hôm nay để tránh trùng (Dựa trên bản cũ)
    const existingShowtimes = await Showtime.find({
      theater: { $in: theaters.map(t => t._id) },
      startTime: { $gte: todayStart, $lt: tomorrowStart }
    }).select("theater startTime").lean();

    const occupiedKey = new Set(
      existingShowtimes.map(s => `${s.theater.toString()}|${new Date(s.startTime).toISOString()}`)
    );

    const newShowtimes = [];

    // 6. Vòng lặp đơn giản như bản cũ
    for (let tIdx = 0; tIdx < theaters.length; tIdx++) {
      const theater = theaters[tIdx];

      for (let sIdx = 0; sIdx < timeSlots.length; sIdx++) {
        const slot = timeSlots[sIdx];
        const startTime = slotToStartTime(todayStart, slot);
        
        const key = `${theater._id.toString()}|${startTime.toISOString()}`;
        
        // Nếu slot này chưa có suất chiếu thì mới tạo
        if (!occupiedKey.has(key)) {
          // Lấy phim theo kiểu xoay vòng (Round-robin)
          const movie = movies[(tIdx + sIdx) % movies.length];

          // Build mảng ghế trực tiếp từ Theater mẫu
          const seats = (theater.seats || []).map(s => ({
            seatNumber: s.seatNumber,
            seatType: s.seatType,
            price: s.price || 0, // Lấy giá trực tiếp từ bảng Theater nếu có
            isBooked: false
          }));

          newShowtimes.push({
            id_movie: movie._id,
            theater: theater._id,
            cinema: theater.cinemaId || null, // Gán trực tiếp cinemaId từ Theater
            startTime: startTime,
            seats: seats
          });
          
          // Đánh dấu đã chiếm chỗ để không lặp lại
          occupiedKey.add(key);
        }
      }
    }

    // 7. Insert dữ liệu
    let createdCount = 0;
    if (newShowtimes.length > 0) {
      const result = await Showtime.insertMany(newShowtimes);
      createdCount = result.length;
    }

    return {
      success: true,
      created: createdCount,
      message: `Đã tạo thành công ${createdCount} suất chiếu mới.`
    };

  } catch (error) {
    console.error("Lỗi hàm generate cũ:", error);
    return {
      success: false,
      message: error.message
    };
  }
};
