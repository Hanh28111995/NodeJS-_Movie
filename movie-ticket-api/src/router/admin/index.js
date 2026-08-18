import express from "express";

import adminMoviesRouter from "./movie.js";
import adminTicketRouter from "./ticket.js";
import adminUserRouter from "./user.js";
import adminShowTimeRouter from "./showTime.js";
import adminSeatTypeRouter from "./seatType.js";
import adminTheaterRouter from "./theater.js";
import adminCinemaRouter from "./cinema.js";
import adminNotificationRouter from "./notification.js";
import adminPromotionRouter from "./promotion.js";
import adminShopRouter from "./shop.js";
import adminBannerRouter from "./banner.js";
// import staffTicketRouter from "../staff/ticket.js";
import scheduleGenRouter from "./schedulteGen.js";

const adminRouter = express.Router();

adminRouter.use("/movie", adminMoviesRouter);
adminRouter.use("/ticket", adminTicketRouter);
adminRouter.use("/user", adminUserRouter);
adminRouter.use("/showtime", adminShowTimeRouter);
adminRouter.use("/branch", adminCinemaRouter);
adminRouter.use("/theater", adminTheaterRouter);
adminRouter.use("/seatType", adminSeatTypeRouter);
adminRouter.use("/schedule-generator", scheduleGenRouter);
adminRouter.use("/notifications", adminNotificationRouter);
adminRouter.use("/promotion", adminPromotionRouter);
adminRouter.use("/shop", adminShopRouter);
adminRouter.use("/banner", adminBannerRouter);


export default adminRouter;
