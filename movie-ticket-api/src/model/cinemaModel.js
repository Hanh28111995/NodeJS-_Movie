import mongoose from "mongoose";

const cinemaSchema = new mongoose.Schema(
  {
    cinemaName: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      type: [Number],
    },
    totalRooms: { type: Number, default: 0 },
    totalSeats: { type: Number, default: 0 },
    directions: { type: String, default: "" },
    amenities: { type: [String], default: [] },
    parking: { type: String, default: "" }, 
  },
  {
    timestamps: true,
    collection: "cinemas",
  },
);

const Cinema = mongoose.model("cinemas", cinemaSchema);

export default Cinema;
