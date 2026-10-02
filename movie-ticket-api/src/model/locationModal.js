import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    vungMien: {
      type: String,
      required: true,
      trim: true,
    },
    cumRap: {
      type: [String],
      default: [],
    },
  },
  {
    collection: "locations",
  }
);

const Location = mongoose.model("location", locationSchema);
export default Location;