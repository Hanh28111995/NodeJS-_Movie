import InforTicket from "../model/inforTicketModel.js";

export const getAllTickets = async () => {
  return await InforTicket.find().lean();
};

export const getTicketById = async (id) => {
  return await InforTicket.findById(id).lean();
};

export const createTicket = async (ticketData) => {
  // Generate transactionId nếu FE không gửi
  if (!ticketData.transactionId) {
    ticketData.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  // Convert startTime từ "DD/MM/YYYY HH:mm" sang Date nếu cần
  if (ticketData.startTime && typeof ticketData.startTime === "string") {
    const parts = ticketData.startTime.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (parts) {
      ticketData.startTime = new Date(`${parts[3]}-${parts[2]}-${parts[1]}T${parts[4]}:${parts[5]}:00.000Z`);
    }
  }
  return await InforTicket.create(ticketData);
};

export const deleteTicket = async (id) => {
  return await InforTicket.findByIdAndDelete(id);
};

export const getUserTickets = async (userId) => {
  return await InforTicket.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
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
