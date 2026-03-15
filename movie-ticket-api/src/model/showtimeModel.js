const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  seatType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SeatType",
    required: true,
  },
  isBooked: { type: Boolean, default: false },
});

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "movie",      // sửa lại
      required: true,
    },
    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cinema",     // sửa lại
      required: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "theater",     // sửa lại
      required: true,
    },

    startTime: { type: Date, required: true },

    seats: [seatSchema],     // embedded seats
  },
  {
    timestamps: true,
    collection: "showtimes",
  }
);

const Showtime = mongoose.model("showtime", showtimeSchema);

export default Showtime;
