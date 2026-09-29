import express from "express";
import customerTicketRouter from "./ticket.js";
import customerHistoryRouter from "./history.js";
import customerShowTimeRouter from "./showtime.js";
import customerOrderRouter from "./order.js";
import customerCouponRouter from "./coupon.js";
import { getMyProfile, updateMyProfile } from "../../controller/customer/user.js";

const customerRouter = express.Router();

customerRouter.get("/profile", getMyProfile);
customerRouter.put("/profile-update", updateMyProfile);
customerRouter.use("/showtime", customerShowTimeRouter);
customerRouter.use("/ticket", customerTicketRouter);
customerRouter.use("/history", customerHistoryRouter);
customerRouter.use("/order", customerOrderRouter);
customerRouter.use("/coupon", customerCouponRouter);

export default customerRouter;
