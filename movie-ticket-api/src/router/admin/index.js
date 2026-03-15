import express from "express";

import adminMoviesRouter from "./movie.js";

import adminTicketRouter from "./ticket.js";

import adminUserRouter from "./user.js";
import adminShowTimeRouter from "./showTime.js";

const adminRouter = express.Router();


adminRouter.use("/movie", adminMoviesRouter);
adminRouter.use("/ticket", adminTicketRouter);
adminRouter.use("/user", adminUserRouter);
adminRouter.use("/showtime", adminShowTimeRouter);
adminRouter.use("/cinema", adminCinemaRouter);
adminRouter.use("/seatType", adminSeatTypeRouter);

export default adminRouter;
