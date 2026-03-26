import express from "express";
import customerTicketRouter from "./ticket.js";
import { getMyProfile, updateMyProfile } from "../../controller/customer/user.js";
import customerShowTimeRouter from "./showtime.js";

const customerRouter = express.Router();

// Profile Routes
customerRouter.get("/profile", getMyProfile);
customerRouter.put("/profile-update", updateMyProfile);

customerRouter.use("/showtime", customerShowTimeRouter);
customerRouter.use("/ticket", customerTicketRouter);

export default customerRouter;
