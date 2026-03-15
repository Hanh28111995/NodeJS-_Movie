import express from "express";
import { get } from "mongoose";
import { bookMytickets, confirmMytickets, getMytickets } from "../../controller/customer/ticket.js";

const customerTicketRouter = express.Router();

customerTicketRouter.get("/my-tickets/:username", getMytickets);
customerTicketRouter.post("/book-tickets/", bookMytickets);
customerTicketRouter.put("/confirm-tickets", confirmMytickets);

export default customerTicketRouter;