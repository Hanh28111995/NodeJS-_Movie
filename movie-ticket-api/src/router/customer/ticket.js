import express from "express";
import { bookMytickets, cancelMytickets, getMytickets } from "../../controller/customer/ticket.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTicket } from "../../validation/index.js";

const customerTicketRouter = express.Router();

customerTicketRouter.get("/all", getMytickets);
customerTicketRouter.post("/bookingTicket", validateBody(submitNewTicket), bookMytickets);
customerTicketRouter.put("/cancel", cancelMytickets);

export default customerTicketRouter;