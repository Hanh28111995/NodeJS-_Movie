import express from "express";
import customerTicketRouter from "./ticket.js";
import { getMyProfile, updateMyProfile } from "../../controller/customer/user.js";

const customerRouter = express.Router();

// Profile Routes
customerRouter.get("/profile", getMyProfile);
customerRouter.put("/profile-update", updateMyProfile);

// Ticket Routes
customerRouter.use("/myticket", customerTicketRouter);

export default customerRouter;
