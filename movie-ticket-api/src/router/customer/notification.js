import express from "express";
import { getMyNotifications, markNotificationAsRead } from "../../controller/customer/notification.js";

const customerNotificationRouter = express.Router();

customerNotificationRouter.get("/", getMyNotifications);
customerNotificationRouter.put("/read/:notificationId", markNotificationAsRead);

export default customerNotificationRouter;
