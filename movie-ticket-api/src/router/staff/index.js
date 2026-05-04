import express from "express";
import staffTicketRouter from "./ticket.js";
import staffUserRouter from "./user.js";
import staffHistoryRouter from "./history.js";

const staffRouter = express.Router();

staffRouter.use("/ticket", staffTicketRouter);
staffRouter.use("/user", staffUserRouter);
staffRouter.use("/history", staffHistoryRouter);

export default staffRouter;
