import express from "express";
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "../../controller/customer/notification.js";

const customerNotificationRouter = express.Router();

customerNotificationRouter.get("/", getMyNotifications);
customerNotificationRouter.put("/read/:notificationId", markNotificationAsRead);
customerNotificationRouter.put("/read-all", markAllNotificationsAsRead);

export default customerNotificationRouter;
