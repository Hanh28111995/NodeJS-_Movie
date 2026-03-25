import mongoose from "mongoose";

const scheduleConfigSchema = new mongoose.Schema(
  {
    movie_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "movies", required: true }],
    timeSlots: [{ type: String, required: true }], // ["09:00", "18:00"]
    theaters: [{ type: mongoose.Schema.Types.ObjectId, ref: "theater", required: true }],
    scheduleTime: {
      type: Number,
      enum: [1, 2, 3], // 1=Daily, 2=Weekly, 3=Monthly
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "scheduleConfigs",
  }
);

const ScheduleConfig = mongoose.model("scheduleConfig", scheduleConfigSchema);
export default ScheduleConfig;
