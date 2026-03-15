import InforTicket from "../model/inforTicketModel.js";

export const getAllTickets = async () => {
  return await InforTicket.find();
};

export const getTicketById = async (id) => {
  return await InforTicket.findById(id);
};

export const createTicket = async (ticketData) => {
  return await InforTicket.create(ticketData);
};

export const deleteTicket = async (id) => {
  return await InforTicket.findByIdAndDelete(id);
};

export const getUserTickets = async (userId) => {
  return await InforTicket.find({ user_id: userId });
};

export const confirmTicketPayment = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");
  
  ticket.paymentStatus = "Completed";
  return await ticket.save();
};

export const cancelTicket = async (ticketId) => {
  const ticket = await InforTicket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");
  
  ticket.paymentStatus = "Failed";
  return await ticket.save();
};
