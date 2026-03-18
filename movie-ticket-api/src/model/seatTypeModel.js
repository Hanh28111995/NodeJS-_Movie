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
      type: String, // ví dụ: "Ghế VIP có tựa tay, rộng hơn ghế thường"
    },
  },
  {
    timestamps: true,
    collection: "seatTypes",
  },
);

const SeatType = mongoose.model("seatTypes", seatTypeSchema);
export default SeatType;
