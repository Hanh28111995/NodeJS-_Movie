import mongoose from "mongoose";
import { nanoid } from "nanoid";

const isValidShiftTime = (value) =>
  typeof value === "string" &&
  /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

const shiftSchema = new mongoose.Schema(
  {
    shiftID: {
      type: String,
      default: () => nanoid(10),
      unique: true,
      trim: true,
    },
    startAt: {
      type: String,
      required: [true, "Thời gian bắt đầu ca là bắt buộc"],
      validate: {
        validator: isValidShiftTime,
        message: "startAt phải có định dạng HH:mm",
      },
    },
    endAt: {
      type: String,
      required: [true, "Thời gian kết thúc ca là bắt buộc"],
      validate: {
        validator: isValidShiftTime,
        message: "endAt phải có định dạng HH:mm",
      },
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "shifts",
  },
);

const Shift = mongoose.model("shifts", shiftSchema);

export default Shift;
