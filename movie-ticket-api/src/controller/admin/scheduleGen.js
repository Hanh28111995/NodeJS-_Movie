import asyncHandler from "../../util/asyncHandler.js";
import { sendSuccess, sendError, sendServerError } from "../../helper/client.js";
import * as scheduleGenService from "../../service/scheduleGenService.js";

export const updateScheduleConfig = asyncHandler(async (req, res) => {
  const { movie_ids, timeSlots, theaters, scheduleTime } = req.body;
  if (!movie_ids?.length || !timeSlots?.length || !theaters?.length || !scheduleTime) {
    return sendError(res, "Thiếu thông tin cấu hình lịch chiếu", 400);
  }
  const config = await scheduleGenService.upsertConfig({ movie_ids, timeSlots, theaters, scheduleTime });
  return sendSuccess(res, "Cập nhật cấu hình lịch chiếu thành công", config);
});

export const activeStatusChange = asyncHandler(async (req, res) => {
  try {
    const isActive = await scheduleGenService.toggleActive();
    return sendSuccess(res, `Lịch tự động đã được ${isActive ? "bật" : "tắt"}`, { isActive });
  } catch (err) {
    return sendError(res, err.message, 404);
  }
});

export const generateShowtimes = asyncHandler(async (req, res) => {
  const result = await scheduleGenService.generate();
  return sendSuccess(res, `Generate xong: ${result.created} mới, ${result.skipped} đã tồn tại`, result);
});
