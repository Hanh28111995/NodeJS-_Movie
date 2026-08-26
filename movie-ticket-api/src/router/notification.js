import express from "express";
import { getMyNotifications, markAllMyNotificationsAsRead, markMyNotificationAsRead } from "../controller/notification/notificationController.js";


const NotificationRouter = express.Router();

NotificationRouter.get("/", getMyNotifications);
NotificationRouter.put("/read/:notificationId", markMyNotificationAsRead);
NotificationRouter.put("/read-all", markAllMyNotificationsAsRead);

export default NotificationRouter;
