import express from "express";
import staffTicketRouter from "./ticket.js";
import staffUserRouter from "./user.js";
import staffHistoryRouter from "./history.js";
import adminNotificationRouter from "../admin/notification.js";

const staffRouter = express.Router();

staffRouter.use("/ticket", staffTicketRouter);
staffRouter.use("/user", staffUserRouter);
staffRouter.use("/history", staffHistoryRouter);
staffRouter.use("/notifications", adminNotificationRouter);

export default staffRouter;
