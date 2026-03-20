import express from "express";
import { bookMytickets, cancelMytickets, confirmMytickets, getMytickets } from "../../controller/customer/ticket.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTicket } from "../../validation/index.js";

const customerTicketRouter = express.Router();

customerTicketRouter.get("/all", getMytickets);
customerTicketRouter.post("/booking", validateBody(submitNewTicket), bookMytickets);
customerTicketRouter.put("/confirm", confirmMytickets);
customerTicketRouter.put("/cancel", cancelMytickets);

export default customerTicketRouter;