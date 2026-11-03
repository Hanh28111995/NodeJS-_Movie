import mongoose from "mongoose";
import { nanoid } from "nanoid";

const staffShiftSchema = new mongoose.Schema(
  {
    staffShiftID: {
      type: String,
      default: () => nanoid(10),
      unique: true,
      trim: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "Nhân viên được phân ca là bắt buộc"],
    },
    date: {
      type: Date,
      required: [true, "Ngày làm việc là bắt buộc"],
    },
    shiftID: {
      type: String,
      required: [true, "shiftID là bắt buộc"],
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "staff_shifts",
  },
);

staffShiftSchema.index(
  { staffId: 1, date: 1, shiftID: 1 },
  { unique: true },
);
staffShiftSchema.index({ date: 1, shiftID: 1 });

const StaffShifts = mongoose.model("staff_shifts", staffShiftSchema);

export default StaffShifts;
