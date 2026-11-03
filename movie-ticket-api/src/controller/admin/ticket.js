import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import ticketService from "../../service/admin/ticketService.js";

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
  try {
    const { id } = req.params;
    const ticket = await ticketService.getTicketById(id);
    return sendSuccess(res, "Ticket found", { ticket });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const addTicket = asyncHandler(async (req, res) => {
  const ticketData = { ...req.body, staff_id: undefined };
  const newTicket = await ticketService.createTicket(ticketData);
  return sendSuccess(res, "Ticket created successfully", newTicket);
});

export const updateTicket = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData.staff_id;
    const updatedTicket = await ticketService.updateTicket(id, updateData);
    return sendSuccess(res, "Ticket updated successfully", updatedTicket);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const deleteTicket = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    await ticketService.deleteTicket(id);
    return sendSuccess(res, "Ticket deleted successfully");
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const cancelTicket = asyncHandler(async (req, res) => {
  try {
    const ticketId = req.body.id || req.body.ticketId;
    const result = await ticketService.cancelTicket(ticketId);
    return sendSuccess(res, "Ticket cancelled successfully", result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});