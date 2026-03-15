import InforTicket from "../../model/inforTicketModel.js";

export const getMytickets = async (req, res) => {
  try {
    const {userName}  = req.params;
    const tickets = await InforTicket.find({ username: userName });
    if (!tickets) {
      return sendError(res, "No tickets found for this user");
    }
    return sendSuccess(res, "User tickets retrieved successfully", tickets[0]);
    } catch (err) {
        console.log(err);   
        sendServerError(res);                
    }
}
export const bookMytickets = async (req, res) => {
    try {
        const userId  = req.user?.user_id;  
        const ticketData = { ...req.body, userId: userId };
        const newTicket = await InforTicket.create(ticketData);
        return sendSuccess(res, "Ticket booked successfully", newTicket);
    } catch (err) {
        console.log(err);   
        sendServerError(res);                
    }                       
}
export const confirmMytickets = async (req, res) => {
    try {
        const { ticketId } = req.body;  
        const ticket = await InforTicket.findById(ticketId);
        if (!ticket) {
            return sendError(res, "Ticket not found");
        }                       
        ticket.status = "confirmed";
        await ticket.save();
        return sendSuccess(res, "Ticket confirmed successfully", ticket);
    } catch (err) {
        console.log(err);   
        sendServerError(res);                
    }
}