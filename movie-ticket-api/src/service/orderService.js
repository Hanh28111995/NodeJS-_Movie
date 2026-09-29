import * as orderRepository from "../repository/orderRepository.js";
import * as couponRepository from "../repository/couponRepository.js";
import { calculateDiscount } from "./couponService.js";
import { sendError, sendSuccess, sendServerError } from "../helper/client.js";
import { releaseCouponHold, tryHoldCoupon } from "./couponHoldService.js";

// Tạo đơn: items từ body, tính tiền, áp coupon
export const createNewOrder = async (res, body) => {
  try {
    const { user_id, items, couponCode } = body;
    if (!user_id || !Array.isArray(items) || items.length === 0)
      return sendError(res, "Thiếu user hoặc danh sách items", 400);

    const subtotal = items.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0,
    );

    let discount = 0;
    if (couponCode) {
      const held = await tryHoldCoupon(couponCode, user_id);
      if (!held)
        return sendError(res, "Có người đang giữ mã này, thử lại sau", 409);
    }

    try {
      discount = await calculateDiscount(couponCode, subtotal, user_id);
    } catch (err) {
      await releaseCouponHold(couponCode, user_id);
      return sendError(
        res,
        {
          COUPON_NOT_FOUND: "Mã không tồn tại",
          COUPON_INACTIVE: "Mã đã ngừng hoạt động",
          COUPON_EXPIRED: "Mã đã hết hạn",
          COUPON_USED_UP: "Mã đã hết lượt sử dụng",
          COUPON_OWNER_MISMATCH: "Mã giảm giá không thuộc về bạn",
          COUPON_MIN_SUBTOTAL: "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã",
        }[err.message] || "Lỗi mã giảm giá",
        400,
      );
    }

    try {
      const order = await orderRepository.createOrder({
        user_id,
        items,
        couponCode: couponCode?.toUpperCase(),
        couponDiscount: discount,
        totalAmount: subtotal - discount,
        paymentMethod: body.paymentMethod,
      });
      return sendSuccess(res, "Tạo đơn hàng thành công", order);
    } catch {
      await releaseCouponHold(couponCode, user_id);   // ← thêm: DB lỗi cũng phải thả hold
      return sendServerError(res);
    }
  } catch {
    return sendServerError(res);
  }
};

export const getMyOrders = async (res, userId) => {
  try {
    const orders = await orderRepository.getOrdersByUser(userId);
    return sendSuccess(res, "Lấy lịch sử đơn hàng thành công", orders);
  } catch {
    return sendServerError(res);
  }
};

export const getOrderDetail = async (res, id) => {
  try {
    const order = await orderRepository.getOrderById(id);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);
    return sendSuccess(res, "Lấy thông tin đơn hàng thành công", order);
  } catch {
    return sendServerError(res);
  }
};

// Dùng khi payment callback: gọi từ paymentService
export const markOrderPaid = async (orderId, transactionId) => {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) return null;
  return orderRepository.updateOrderPayment(order._id, {
    paymentStatus: "Completed",
    transactionId,
  });
};

export const cancelOrder = async (orderId) => {
  const order = await orderRepository.getOrderById(orderId);
  if (!order) return null;
  return orderRepository.updateOrderStatus(order._id, "Cancelled");
};

// ---- Admin ----
export const listAllOrders = async (res, page, pageSize) => {
  try {
    const [orders, total] = await Promise.all([
      orderRepository.getAllOrders(page, pageSize),
      orderRepository.countOrders(),
    ]);
    return sendSuccess(res, "Lấy danh sách đơn hàng thành công", {
      orders,
      total,
      page,
    });
  } catch {
    return sendServerError(res);
  }
};

export const changeOrderStatus = async (res, id, paymentStatus) => {
  try {
    const order = await orderRepository.updateOrderStatus(id, paymentStatus);
    if (!order) return sendError(res, "Không tìm thấy đơn hàng", 404);
    return sendSuccess(res, "Cập nhật trạng thái đơn hàng thành công", order);
  } catch {
    return sendServerError(res);
  }
};
