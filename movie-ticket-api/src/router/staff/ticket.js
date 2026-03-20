import express from "express";
import {
  searchTicketByStaff,
  getAllTicketsByStaff,
  createCustomerByStaff,
  bookForCustomer,
} from "../../controller/staff/ticket.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTicket } from "../../validation/index.js";

const staffTicketRouter = express.Router();

staffTicketRouter.get("/search", searchTicketByStaff);
staffTicketRouter.get("/all", getAllTicketsByStaff);
staffTicketRouter.post("/create-customer", createCustomerByStaff);
staffTicketRouter.post("/bookingTicket", validateBody(submitNewTicket), bookForCustomer);

export default staffTicketRouter;
