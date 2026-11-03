import mongoose from "mongoose";
import { nanoid } from "nanoid";

const paymentItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ticket", "order"],
      required: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Số tiền không được âm"],
    },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      default: () => nanoid(14),
      unique: true,
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    items: {
      type: [paymentItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "Payment phải có ít nhất một mục",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [1, "Tổng tiền phải lớn hơn 0"],
    },
    paymentMethod: {
      type: String,
      enum: ["MOMO", "VNPAY", "CASH"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled"],
      default: "Pending",
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    staff_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  {
    timestamps: true,
    collection: "payments",
  },
);

paymentSchema.index({ user_id: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payments = mongoose.model("payments", paymentSchema);

export default Payments;
