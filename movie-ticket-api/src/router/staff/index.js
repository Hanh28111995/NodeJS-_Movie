import express from "express";
import staffTicketRouter from "./ticket.js";
import staffUserRouter from "./user.js";

const staffRouter = express.Router();

staffRouter.use("/ticket", staffTicketRouter);
staffRouter.use("/user", staffUserRouter);

export default staffRouter;
