import express from "express";
import { bookMytickets, cancelMytickets, confirmMytickets, getMytickets } from "../../controller/customer/ticket.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTicket } from "../../validation/index.js";

const customerTicketRouter = express.Router();

customerTicketRouter.get("/my-tickets", getMytickets);
customerTicketRouter.post("/book-tickets", validateBody(submitNewTicket), bookMytickets);
customerTicketRouter.put("/confirm-tickets", confirmMytickets);
customerTicketRouter.put("/cancel-tickets", cancelMytickets);

export default customerTicketRouter;