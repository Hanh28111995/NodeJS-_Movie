import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id_ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "infoTicket",
      required: true,
    },
    id_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
    ticketStatus: {
      type: String,      
      default: "Pending",
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

const Notification = mongoose.model("notifications", notificationSchema);

export default Notification;
