import express from "express";
import {
  getMyNotifications,
  markAllMyNotificationsAsRead,
  markMyNotificationAsRead,
} from "../controller/notification/notificationController.js";
import { verifyToken } from "../middleware/index.js";

const NotificationRouter = express.Router();

NotificationRouter.get("/", verifyToken, getMyNotifications);
NotificationRouter.put(
  "/read/:notificationId",
  verifyToken,
  markMyNotificationAsRead,
);
NotificationRouter.put("/read-all", verifyToken, markAllMyNotificationsAsRead);

export default NotificationRouter;
