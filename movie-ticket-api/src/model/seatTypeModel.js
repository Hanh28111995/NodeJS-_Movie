import mongoose from "mongoose";

const seatTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // tên loại ghế
      enum: ["Standard", "VIP", "Double"],
    },
    price: {
      type: Number,
      required: true, // giá mặc định
    },
    description: {
      type: String,
    },
    color: {
      type: String,
      default: "#cccccc", // màu mặc định
    },
  },
  {
    timestamps: true,
    collection: "seatTypes",
  },
);

const SeatType = mongoose.model("seatTypes", seatTypeSchema);
export default SeatType;
