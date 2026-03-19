import mongoose from "mongoose";

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  seatType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "seatTypes",
    required: true,
  },
  price: { type: Number, default: 0 },
  isBooked: { type: Boolean, default: false },
});

const showtimeSchema = new mongoose.Schema(
  {
    id_movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "movies",
      required: true,
    },
    cinema: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cinemas",
      required: true,
    },
    theater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "theater",
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

showtimeSchema.index({ movie: 1, startTime: 1 });
showtimeSchema.index({ cinema: 1, theater: 1 });

const Showtime = mongoose.model("showtime", showtimeSchema);

export default Showtime;
