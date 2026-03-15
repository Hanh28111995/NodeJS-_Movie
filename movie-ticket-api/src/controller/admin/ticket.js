import { sendSuccess } from "../../helper/client.js";
import * as ticketService from "../../service/ticketService.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketService.getAllTickets();
  return sendSuccess(res, "All tickets retrieved successfully", tickets);
});

export const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const aTicket = await ticketService.getTicketById(id);
  return sendSuccess(res, "Ticket found", aTicket);
});

export const addTicket = asyncHandler(async (req, res) => {
  const newTicket = await ticketService.createTicket(req.body);
  return sendSuccess(res, "Ticket created successfully", newTicket);
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ticketService.deleteTicket(id);
  return sendSuccess(res, "Ticket deleted successfully");
});
