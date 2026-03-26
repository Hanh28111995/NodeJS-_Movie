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

  // Check xem hôm nay đã có showtime chưa (theo bất kỳ theater nào trong config)
  const firstSlot = config.timeSlots[0];
  const [fh, fm] = firstSlot.split(":").map(Number);
  const todayFirstSlotUTC = new Date(todayVN.getTime() + (fh * 60 + fm) * 60000 - VN_OFFSET);

  const todayExists = await Showtime.findOne({
    theater: { $in: config.theaters },
    startTime: todayFirstSlotUTC,
  });

  // Nếu hôm nay đã có → generate cho ngày mai
  const targetVN = todayExists
    ? new Date(todayVN.getTime() + 86400000)
    : todayVN;

  let created = 0, updated = 0;

  for (const theaterId of config.theaters) {
    for (let i = 0; i < config.timeSlots.length; i++) {
      const slot = config.timeSlots[i];
      const movieId = config.movie_ids[i % config.movie_ids.length];
      const [hour, minute] = slot.split(":").map(Number);
      const startTime = new Date(targetVN.getTime() + (hour * 60 + minute) * 60000 - VN_OFFSET);

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

  return { created, updated, targetDate: targetVN.toISOString() };
};
