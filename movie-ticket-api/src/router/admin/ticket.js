import { addTicket, deleteTicket, getAllTickets, getTicketById } from "../../controller/admin/ticket.js";


import express from "express";

const adminTicketRouter = express.Router();


/**
 * @route get /api/admin/ticket/all
 * @description find all tickets
 * @access private (admin only)
 */

adminTicketRouter.get("/all", getAllTickets);


/**
 * @route get /api/admin/ticket/:userid/:movieid
 * @description finf ticket by id
 * @access private (admin only)
 */

adminTicketRouter.get("/:userId/:ticketId", getTicketById);

/**
 * @route POST /api/admin/ticket/add
 * @description add ticket
 * @access private (admin only)
 */
adminTicketRouter.post("/add", addTicket);


/**
 * @route DELETE /api/movies/:id
 * @description delete movie by id
 * @access private (admin only)
 */
adminTicketRouter.delete("/delete/:id", deleteTicket);

export default adminTicketRouter;
