import mongoose from "mongoose";
import { nanoid } from "nanoid";

const couponSchema = new mongoose.Schema(
  {
    coupon_id: {
      type: String,
      default: () => nanoid(10),
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // Tự động viết hoa mã giảm giá
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    maxDiscount: {
      type: Number,
      required: true,
      min: 0,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    type: {
      type: String,
      enum: ["admin", "redeem"],
      default: "admin",
    },
    minSubtotal: {
      type: Number,
      default: 0,
    },
    maxUsage: {
      type: Number,
      default: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "coupons",
  }
);

couponSchema.index({ code: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ owner_id: 1 });

const Coupons = mongoose.model("coupons", couponSchema);

export default Coupons;