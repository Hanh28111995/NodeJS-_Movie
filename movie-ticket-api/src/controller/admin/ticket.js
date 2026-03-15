import { submitNewTicket } from "../../validation/index.js";
import InforTicket from "../../model/inforTicketModel.js";
import { sendServerError, sendSuccess, sendError } from "../../helper/client.js";

export const getAllTickets = async (req, res) => {
  try {
    const tickets = await InforTicket.find();
    if (!tickets) {
      return sendError(res, "No tickets found");
    }
    return sendSuccess(res, "All tickets retrieved successfully", tickets);
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { userId, ticketId } = req.params;
    const aTicket = await InforTicket.findById(
      {
        ticketID: ticketId,
        userId: userId,
      },
      req.body
    );
    if (!aTicket) {
      return sendError(res, "Ticket not found");
    }
    return sendSuccess(res, "Ticket found", aTicket);
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};

export const addTicket = async (req, res) => {
  try {
    const newTicket = await InforTicket.create(req.body);
    const validate = submitNewTicket(req.body);
    if (validate) return sendError(res, error);
    return sendSuccess(res, "Ticket created successfully", newTicket);
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const aTicket = await InforTicket.findById(id);
    if (!aTicket) {
      return sendError(res, "Ticket not found");
    }
    const deletedTicket = await InforTicket.findByIdAndDelete(id);
    return sendSuccess(res, "Ticket deleted successfully");
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};
