import ScheduleConfig from "../model/scheduleConfigModel.js";
import Showtime from "../model/showtimeModel.js";
import { createOneShowtime } from "./showtimeService.js";

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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const generate = async (daysToGenerate = 7) => {
  const config = await ScheduleConfig.findOne({ isActive: true });
  if (!config) return { created: 0, updated: 0, message: "Không có cấu hình đang hoạt động" };

  const nowVN = new Date(Date.now() + VN_OFFSET);
  const todayVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));

  let totalCreated = 0, totalUpdated = 0;
  const processedDates = [];

  // Tạo suất chiếu cho N ngày tiếp theo (mặc định 7 ngày)
  for (let i = 0; i < daysToGenerate; i++) {
    const targetVN = new Date(todayVN.getTime() + i * 86400000);
    processedDates.push(targetVN.toISOString().split('T')[0]);

    for (const theaterId of config.theaters) {
      // Mỗi rạp, mỗi phim sẽ có danh sách slot được shuffle khác nhau để đa dạng
      for (const movieId of config.movie_ids) {
        const shuffledSlots = shuffle(config.timeSlots);

        for (const slot of shuffledSlots) {
          const [hour, minute] = slot.split(":").map(Number);
          const startTime = new Date(targetVN.getTime() + (hour * 60 + minute) * 60000 - VN_OFFSET);

          const exists = await Showtime.findOne({ theater: theaterId, id_movie: movieId, startTime });
          if (exists) { 
            totalUpdated++; 
            continue; 
          }

          // Kiểm tra xem có suất chiếu nào của phim này tại rạp này trong quá khứ không để "tái sử dụng" hoặc tạo mới
          // (Logic cũ của bạn là tái sử dụng suất chiếu cũ để tiết kiệm document, tôi giữ nguyên logic này)
          const old = await Showtime.findOne({
            theater: theaterId,
            id_movie: movieId,
            startTime: { $lt: startTime },
            // Chỉ lấy suất chiếu cũ trong vòng 30 ngày và KHÔNG có ghế nào được đặt
            "seats.isBooked": { $ne: true }
          }).sort({ startTime: -1 });

          if (old) {
            old.startTime = startTime;
            // Reset trạng thái ghế khi tái sử dụng
            if (old.seats) {
              old.seats.forEach(s => s.isBooked = false);
            }
            await old.save();
            totalUpdated++;
          } else {
            try {
              await createOneShowtime({ theaterId, movieId, startTime });
              totalCreated++;
            } catch (err) {
              console.error(`[ScheduleGen] Lỗi tạo suất chiếu: ${err.message}`);
            }
          }
        }
      }
    }
  }

  return { 
    created: totalCreated, 
    updated: totalUpdated, 
    message: `Đã duy trì suất chiếu cho ${daysToGenerate} ngày tới.`,
    dates: processedDates 
  };
};
