import asyncHandler from "../../util/asyncHandler.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import scheduleGenService from "../../service/scheduleGenService.js";

export const getSchedulePlan = asyncHandler(async (req, res) => {
  const schedule = await scheduleGenService.getConfig();
  return sendSuccess(res, "Schedule plan configuration retrieved successfully", { schedule });
});

export const createSchedulePlan = asyncHandler(async (req, res) => {
  const { movies, timeSlots, theaters, scheduleType, generateDays, isActive } = req.body;
  if (!movies?.length || !timeSlots?.length || !theaters?.length) {
    return sendError(res, "Missing required schedule configuration information", 400);
  }
  try {
    const config = await scheduleGenService.createConfig({ movies, timeSlots, theaters, scheduleType, generateDays, isActive });
    return sendSuccess(res, "Schedule plan configuration created successfully", config);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
});

export const editSchedulePlan = asyncHandler(async (req, res) => {
  const { movies, timeSlots, theaters, scheduleType, generateDays, isActive } = req.body;
  if (!movies?.length || !timeSlots?.length || !theaters?.length) {
    return sendError(res, "Missing required schedule configuration information", 400);
  }
  try {
    const config = await scheduleGenService.updateConfig({ movies, timeSlots, theaters, scheduleType, generateDays, isActive });
    return sendSuccess(res, "Schedule plan configuration updated successfully", config);
  } catch (err) {
    return sendError(res, err.message, 404);
  }
});

// ⭐ Route mới: sinh suất chiếu ngay
export const generateSchedulePlan = asyncHandler(async (req, res) => {
  const result = await scheduleGenService.generateSchedule();
  return sendSuccess(res, result.message, result);
});