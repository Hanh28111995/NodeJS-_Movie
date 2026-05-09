import express from "express";
import {
  searchTicketByStaff,
  getAllTicketsByStaff,
  createCustomerByStaff,
  bookForCustomer,
  cancelTicket,
  confirmTicket,  
} from "../../controller/staff/ticket.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewTicket } from "../../validation/index.js";
import { cashConfirmPayment } from "../../controller/payment/paymentController.js";

const staffTicketRouter = express.Router();

staffTicketRouter.get("/search", searchTicketByStaff);
staffTicketRouter.get("/all", getAllTicketsByStaff);
staffTicketRouter.post("/create-customer", createCustomerByStaff);
staffTicketRouter.post("/bookingTicket", validateBody(submitNewTicket), bookForCustomer);
staffTicketRouter.post("/cancelTicket", validateBody(submitNewTicket), cancelTicket);
staffTicketRouter.post("/completeTicket", validateBody(submitNewTicket), confirmTicket); 

export default staffTicketRouter;
