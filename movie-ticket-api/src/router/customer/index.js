import express from "express";
import customerTicketRouter from "./ticket.js";
import customerHistoryRouter from "./history.js";
import customerShowTimeRouter from "./showtime.js";
import customerOrderRouter from "./order.js";
import customerCouponRouter from "./coupon.js";
import customerFavoriteRouter from "./favorite.js";
import customerReviewRouter from "./review.js";
import { getMyProfile, updateMyProfile } from "../../controller/customer/user.js";


const customerRouter = express.Router();

customerRouter.get("/profile", getMyProfile);
customerRouter.put("/profile-update", updateMyProfile);
customerRouter.use("/showtime", customerShowTimeRouter);
customerRouter.use("/ticket", customerTicketRouter);
customerRouter.use("/history", customerHistoryRouter);
customerRouter.use("/order", customerOrderRouter);
customerRouter.use("/coupon", customerCouponRouter);
customerRouter.use("/favorite", customerFavoriteRouter);
customerRouter.use("/review", customerReviewRouter);

export default customerRouter;
