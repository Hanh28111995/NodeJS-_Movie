import ticketRepository from "../../repository/ticketRepository.js";

class TicketService {
  async getAllTickets({ page, limit, paymentStatus }) {
    const skip = (page - 1) * limit;
    const query = {};

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const { tickets, total } = await ticketRepository.findAll(query, skip, limit);

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(id) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      const error = new Error("Ticket not found");
      error.statusCode = 404;
      throw error;
    }
    return ticket;
  }

  async createTicket(ticketData) {
    const newTicket = await ticketRepository.create(ticketData);
    return newTicket;
  }

  async updateTicket(id, updateData) {
    const updatedTicket = await ticketRepository.updateById(id, updateData);
    if (!updatedTicket) {
      const error = new Error("Ticket not found to update");
      error.statusCode = 404;
      throw error;
    }
    return updatedTicket;
  }

  async deleteTicket(id) {
    const ticket = await ticketRepository.findByIdRaw(id);
    if (!ticket) {
      const error = new Error("Ticket not found to delete");
      error.statusCode = 404;
      throw error;
    }
    await ticketRepository.deleteById(id);
    return true;
  }

  async cancelTicket(ticketId) {
    if (!ticketId) {
      const error = new Error("Ticket ID is required for cancellation");
      error.statusCode = 400;
      throw error;
    }

    const ticket = await ticketRepository.findByIdRaw(ticketId);
    if (!ticket) {
      const error = new Error("Ticket not found");
      error.statusCode = 404;
      throw error;
    }

    // Cập nhật trạng thái hủy vé (ví dụ: status = 'cancelled')
    const updatedTicket = await ticketRepository.updateById(ticketId, { status: "cancelled" });
    return updatedTicket;
  }
}

export default new TicketService();