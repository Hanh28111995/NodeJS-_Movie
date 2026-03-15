import { addTicket, deleteTicket, getAllTickets, getTicketById } from "../../controller/admin/ticket.js";
import express from "express";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTicket } from "../../validation/index.js";

const adminTicketRouter = express.Router();

adminTicketRouter.get("/all", getAllTickets);

adminTicketRouter.get("/:id", getTicketById);

adminTicketRouter.post("/add", validateBody(submitNewTicket), addTicket);

adminTicketRouter.delete("/delete/:id", deleteTicket);

export default adminTicketRouter;
