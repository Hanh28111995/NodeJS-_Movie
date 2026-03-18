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
  },
  {
    timestamps: true,
    collection: "cinemas",
  }
);

const Cinema = mongoose.model("cinemas", cinemaSchema);

export default Cinema;
