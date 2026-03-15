import express from "express";
import { searchTicketByStaff, getAllTicketsByStaff } from "../../controller/staff/ticket.js";

const staffRouter = express.Router();

staffRouter.get("/ticket/search", searchTicketByStaff);
staffRouter.get("/ticket/all", getAllTicketsByStaff);

export default staffRouter;
