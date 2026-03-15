const mongoose = require("mongoose");

const ExportedTicketSchema = new mongoose.Schema(
  {
    ticketID: {
      type: String,
      required: true,
      unique: true,
    },
    seatName: {
      type: String,
      required: true,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "exportedTickets", // specify the collection name here
  }
);

const ExTicket = mongoose.model("exportedTickets", ExportedTicketSchema);

export default ExTicket;
