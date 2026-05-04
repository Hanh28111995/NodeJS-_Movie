import Notification from "../../model/userCartNotificationModel.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const notifications = await Notification.find({ id_user: userId })
    .populate("id_ticket", "startTime seatName paymentStatus transactionId")
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, "Notifications retrieved successfully", { notifications });
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, id_user: userId },
    { status: true },
    { new: true }
  );

  if (!notification) {
    return sendError(res, "Notification not found", 404);
  }

  return sendSuccess(res, "Notification marked as read", notification);
});
