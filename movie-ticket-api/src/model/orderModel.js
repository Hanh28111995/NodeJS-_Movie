import mongoose from "mongoose";
import { nanoid } from "nanoid";

const orderSchema = new mongoose.Schema(
  {
    order_id: {
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
    items: [
      {
        kind: {
          type: String,
          enum: {
            values: ["ticket", "shop"],
            message: "{VALUE} không phải là phân loại hợp lệ (chỉ hỗ trợ ticket hoặc shop)",
          },
          required: true,
        },
        ref_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: {
          type: String,
          required: [true, "Tên sản phẩm/vé không được để trống"],
          trim: true,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: [0, "Giá tiền không được âm"],
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Số lượng tối thiểu là 1"],
        },
      },
    ],
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, "Tổng tiền sau giảm giá là bắt buộc"],
      min: [0, "Tổng tiền không được âm"],
    },
    paymentMethod: {
      type: String,
      enum: ["MOMO", "VNPAY", "ZALOPAY", "CASH", "CREDIT_CARD"],
      required: [true, "Phương thức thanh toán là bắt buộc"],
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Cancelled"],
      default: "Pending",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Cho phép giá trị null/undefined khi chưa thanh toán nhưng phải là duy nhất nếu đã có
      trim: true,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt thay thế cho trường createdAt thủ công
    collection: "orders",
  }
);

// Tạo index để tối ưu truy vấn lịch sử mua hàng của user và sắp xếp theo thời gian mới nhất
orderSchema.index({ user_id: 1, createdAt: -1 });

const Orders = mongoose.model("orders", orderSchema);

export default Orders;