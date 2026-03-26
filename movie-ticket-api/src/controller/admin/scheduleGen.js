import asyncHandler from "../../util/asyncHandler.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import * as scheduleGenService from "../../service/scheduleGenService.js";

export const getSchedulePlan = asyncHandler(async (req, res) => {
  const config = await scheduleGenService.getConfig();
  return sendSuccess(res, "Lấy cấu hình thành công", config);
});

export const createSchedulePlan = asyncHandler(async (req, res) => {
  const { movie_ids, timeSlots, theaters, scheduleTime } = req.body;
  if (!movie_ids?.length || !timeSlots?.length || !theaters?.length || !scheduleTime) {
    return sendError(res, "Thiếu thông tin cấu hình lịch chiếu", 400);
  }
  try {
    const config = await scheduleGenService.createConfig({ movie_ids, timeSlots, theaters, scheduleTime });
    return sendSuccess(res, "Tạo cấu hình lịch chiếu thành công", config);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

export const editSchedulePlan = asyncHandler(async (req, res) => {
  const { movie_ids, timeSlots, theaters, scheduleTime, isActive } = req.body;
  if (!movie_ids?.length || !timeSlots?.length || !theaters?.length || !scheduleTime) {
    return sendError(res, "Thiếu thông tin cấu hình lịch chiếu", 400);
  }
  try {
    const config = await scheduleGenService.updateConfig({ movie_ids, timeSlots, theaters, scheduleTime, isActive });
    return sendSuccess(res, "Cập nhật cấu hình lịch chiếu thành công", config);
  } catch (err) {
    return sendError(res, err.message, 404);
  }
});
