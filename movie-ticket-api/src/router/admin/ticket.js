import { addTicket, deleteTicket, getAllTickets, getTicketById, updateTicket, cancelTicket } from "../../controller/admin/ticket.js";
import express from "express";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTicket } from "../../validation/index.js";

const adminTicketRouter = express.Router();

adminTicketRouter.get("/all", getAllTickets);

adminTicketRouter.get("/:id", getTicketById);

adminTicketRouter.put("/update/:id", validateBody(submitNewTicket), updateTicket);

adminTicketRouter.post("/add", validateBody(submitNewTicket), addTicket);

adminTicketRouter.delete("/delete/:id", deleteTicket);

adminTicketRouter.post("/cancelTicket", validateBody(submitNewTicket), cancelTicket);           
export default adminTicketRouter;
