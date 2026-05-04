import express from "express";
import { getAllNotifications, markNotificationAsReadByAdmin, markAllNotificationsAsReadByAdmin } from "../../controller/admin/notification.js";

const adminNotificationRouter = express.Router();

adminNotificationRouter.get("/", getAllNotifications);
adminNotificationRouter.put("/read/:notificationId", markNotificationAsReadByAdmin);
adminNotificationRouter.put("/read-all", markAllNotificationsAsReadByAdmin);

export default adminNotificationRouter;
