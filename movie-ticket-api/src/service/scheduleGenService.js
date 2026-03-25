import ScheduleConfig from "../model/scheduleConfigModel.js";
import { createOneShowtime } from "./showtimeService.js";

const VN_OFFSET = 7 * 60 * 60 * 1000;

function getTargetDates(now, scheduleTime) {
  const nowVN = new Date(now.getTime() + VN_OFFSET);
  const todayVN = new Date(Date.UTC(nowVN.getUTCFullYear(), nowVN.getUTCMonth(), nowVN.getUTCDate()));

  if (scheduleTime === 1) return [new Date(todayVN.getTime() + 86400000)];
  if (scheduleTime === 2) return Array.from({ length: 7 },  (_, i) => new Date(todayVN.getTime() + (i + 1) * 86400000));
  if (scheduleTime === 3) return Array.from({ length: 30 }, (_, i) => new Date(todayVN.getTime() + (i + 1) * 86400000));
  return [];
}

export const upsertConfig = async ({ movie_ids, timeSlots, theaters, scheduleTime }) => {
  return await ScheduleConfig.findOneAndUpdate(
    {},
    { movie_ids, timeSlots, theaters, scheduleTime, isActive: true },
    { upsert: true, new: true }
  );
};

export const toggleActive = async () => {
  const config = await ScheduleConfig.findOne();
  if (!config) throw new Error("Chưa có cấu hình lịch chiếu");
  config.isActive = !config.isActive;
  await config.save();
  return config.isActive;
};

export const generate = async () => {
  const config = await ScheduleConfig.findOne({ isActive: true });
  if (!config) return { created: 0, skipped: 0, message: "Không có cấu hình đang hoạt động" };

  const targetDates = getTargetDates(new Date(), config.scheduleTime);
  let created = 0, skipped = 0;

  for (const theaterId of config.theaters) {
    for (const movieId of config.movie_ids) {
      for (const date of targetDates) {
        for (const slot of config.timeSlots) {
          const [hour, minute] = slot.split(":").map(Number);
          const startTime = new Date(date.getTime() + (hour * 60 + minute) * 60000 - VN_OFFSET);
          try {
            await createOneShowtime({ theaterId, movieId, startTime });
            created++;
          } catch {
            skipped++;
          }
        }
      }
    }
  }

  return { created, skipped };
};
