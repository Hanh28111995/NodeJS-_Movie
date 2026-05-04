import Notification from "../../model/userCartNotificationModel.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

/**
 * @desc Lấy toàn bộ thông báo cho Admin/Staff (tất cả người dùng)
 */
export const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find()
    .populate("id_ticket", "startTime seatName paymentStatus transactionId")
    .populate("id_user", "username email")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return sendSuccess(res, "All notifications retrieved successfully", { notifications });
});

/**
 * @desc Đánh dấu thông báo là đã đọc (Dành cho Admin/Staff quản lý)
 */
export const markNotificationAsReadByAdmin = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { status: true },
    { new: true }
  );

  if (!notification) {
    return sendError(res, "Notification not found", 404);
  }

  return sendSuccess(res, "Notification marked as read", notification);
});
