import mongoose from "mongoose";
import { nanoid } from "nanoid";

const reviewSchema = new mongoose.Schema(
  {
    review_id: {
      type: String,
      default: () => nanoid(10),
      unique: true,
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "ID người dùng là bắt buộc"],
    },
    movie_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "movies",
      required: [true, "ID phim là bắt buộc"],
    },
    rating: {
      type: Number,
      required: [true, "Điểm đánh giá là bắt buộc"],
      min: [1, "Điểm đánh giá tối thiểu là 1 sao"],
      max: [5, "Điểm đánh giá tối đa là 5 sao"], // Hoặc hệ thống thang 10 tùy bạn chọn
    },
    comment: {
      type: String,
      required: [true, "Nội dung đánh giá không được để trống"],
      trim: true,
      maxlength: [500, "Nội dung đánh giá không được vượt quá 500 ký tự"],
    },
  },
  {
    timestamps: true,
    collection: "reviews",
  }
);

// Tạo index để truy vấn nhanh danh sách đánh giá của một bộ phim hoặc lịch sử đánh giá của user
reviewSchema.index({ movie_id: 1, createdAt: -1 });
reviewSchema.index({ user_id: 1 });

const Reviews = mongoose.model("reviews", reviewSchema);

export default Reviews;