import express from "express";
import { getAllNotifications, markNotificationAsReadByAdmin } from "../../controller/admin/notification.js";

const adminNotificationRouter = express.Router();

adminNotificationRouter.get("/", getAllNotifications);
adminNotificationRouter.put("/read/:notificationId", markNotificationAsReadByAdmin);

export default adminNotificationRouter;
