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

export const generate = async () => {
  const config = await ScheduleConfig.findOne({ isActive: true });
  if (!config) return { created: 0, updated: 0, message: "Không có cấu hình đang hoạt động" };

  const nowVN = new Date(Date.now() + VN_OFFSET);
  const todayVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));

  let created = 0, updated = 0;

  for (const theaterId of config.theaters) {
    for (const movieId of config.movie_ids) {
      for (const slot of config.timeSlots) {
        const [hour, minute] = slot.split(":").map(Number);
        const startTime = new Date(todayVN.getTime() + (hour * 60 + minute) * 60000 - VN_OFFSET);

        const exists = await Showtime.findOne({ theater: theaterId, id_movie: movieId, startTime });
        if (exists) { updated++; continue; }

        const old = await Showtime.findOne({
          theater: theaterId,
          id_movie: movieId,
          startTime: { $gte: new Date(startTime.getTime() - 86400000 * 30), $lt: startTime },
        }).sort({ startTime: -1 });

        if (old) {
          old.startTime = startTime;
          await old.save();
          updated++;
        } else {
          try {
            await createOneShowtime({ theaterId, movieId, startTime });
            created++;
          } catch { /* skip */ }
        }
      }
    }
  }

  return { created, updated };
};
