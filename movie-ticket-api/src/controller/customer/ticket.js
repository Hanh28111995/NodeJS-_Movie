import { sendSuccess } from "../../helper/client.js";
import * as ticketService from "../../service/ticketService.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getMytickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const tickets = await ticketService.getUserTickets(userId);
  return sendSuccess(res, "User tickets retrieved successfully", tickets);
});

export const bookMytickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const ticketData = { ...req.body, user_id: userId };
  const newTicket = await ticketService.createTicket(ticketData);
  return sendSuccess(res, "Ticket booked successfully", newTicket);
});

export const confirmMytickets = asyncHandler(async (req, res) => {
  const { ticketId } = req.body;
  const ticket = await ticketService.confirmTicketPayment(ticketId);
  return sendSuccess(res, "Ticket confirmed successfully", ticket);
});

export const cancelMytickets = asyncHandler(async (req, res) => {
  const { ticketId } = req.body;
  const ticket = await ticketService.cancelTicket(ticketId);
  return sendSuccess(res, "Ticket cancelled successfully", ticket);
});