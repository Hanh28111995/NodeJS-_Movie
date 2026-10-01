import mongoose from "mongoose";

// Một phim + cửa sổ chiếu của nó
const movieWindowSchema = new mongoose.Schema(
  {
    movie_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "movies",
      required: true,
    },
    startDate: { type: Date, required: true },   // chiếu từ ngày
    endDate:   { type: Date, required: true },   // chiếu đến ngày (>= startDate)
  },
  { _id: false },
);

const scheduleConfigSchema = new mongoose.Schema(
  {
    // Danh sách phim sẽ chiếu, mỗi phim kèm khoảng thời gian riêng
    movies: {
      type: [movieWindowSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Cần ít nhất 1 phim trong cấu hình",
      },
    },

    // Template giờ chiếu áp dụng cho mỗi phòng mỗi ngày
    // VD: ["09:00", "12:00", "15:00", "18:00", "21:00"]
    timeSlots: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Cần ít nhất 1 khung giờ",
      },
    },

    // Các phòng (theaters) sẽ sinh suất chiếu
    theaters: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "theater" }],
      required: true,
    },

    // Chu kỳ sinh: 1=Daily, 2=Weekly, 3=Monthly
    scheduleType: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },

    // ⭐ Sinh trước N ngày — cron chạy hằng ngày, tự lấp các ngày phía trước
    generateDays: {
      type: Number,
      default: 3,
      min: 1,
      max: 14,
    },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "scheduleConfigs",
  },
);

const ScheduleConfig = mongoose.model("scheduleConfig", scheduleConfigSchema);
export default ScheduleConfig;