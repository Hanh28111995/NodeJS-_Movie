import {
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import notificationService from "../../service/notificationService.js";

/**
 * @desc Lấy danh sách thông báo cá nhân (giới hạn 50 thông báo mới nhất và tự động dọn dẹp phần thừa)
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  // Lấy userId từ req.user (do middleware verifyToken cung cấp)
  const userId = req.user?._id || req.user?.id;

  const result = await notificationService.getMyNotifications(userId);
  return sendSuccess(res, "My notifications retrieved successfully", result);
});

/**
 * @desc Đánh dấu một thông báo cá nhân là đã đọc
 */
export const markMyNotificationAsRead = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { notificationId } = req.params;

    const notification = await notificationService.markMyNotificationAsRead(notificationId, userId);
    return sendSuccess(res, "Notification marked as read", notification);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

/**
 * @desc Đánh dấu tất cả thông báo cá nhân là đã đọc
 */
export const markAllMyNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?._id || req.user?.id;

  const result = await notificationService.markAllMyNotificationsAsRead(userId);
  return sendSuccess(res, "All notifications marked as read", result);
});

/**
 * @desc Xóa một thông báo cá nhân theo ID
 */
export const deleteMyNotification = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { notificationId } = req.params;

    await notificationService.deleteMyNotification(notificationId, userId);
    return sendSuccess(res, "Notification deleted successfully");
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});