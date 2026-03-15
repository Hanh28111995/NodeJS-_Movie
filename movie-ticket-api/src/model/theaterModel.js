import mongoose from "mongoose";

const theaterSchema = new mongoose.Schema(
  {
    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cinema",
    },
    name: {
      type: String,
      required: true,
    },
    totalSeat: {
      rows: { type: Number, required: true },
      cols: { type: Number, required: true },
    },
    seats: [
      {
        seatNumber: { type: String, required: true },
        seatType: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SeatType",
          required: true,
        },
        isBooked: { type: Boolean, default: false },
      },
    ],
    description: {
      type: String, // ví dụ: "lối đi bắt đầu từ hàng 5"
    },
  },
  {
    timestamps: true,
    collection: "theaters",
  }
);

const Theater = mongoose.model("theater", theaterSchema);

export default Theater;
