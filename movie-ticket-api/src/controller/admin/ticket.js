import { sendSuccess } from "../../helper/client.js";
import * as ticketService from "../../service/ticketService.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getAllTickets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, paymentStatus } = req.query;
  const result = await ticketService.getAllTickets({
    page: Number(page),
    limit: Number(limit),
    paymentStatus,
  });
  return sendSuccess(res, "All tickets retrieved successfully", result);
});

export const getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await ticketService.getTicketById(id);
  return sendSuccess(res, "Ticket found", { ticket });
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
