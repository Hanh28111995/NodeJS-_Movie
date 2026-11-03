import { sendError, sendSuccess } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import {
  checkoutCartItems,
  getPaymentForUser,
} from "../../service/payment/cartPaymentService.js";

const handlePaymentError = (res, error) => {
  if (error.statusCode) return sendError(res, error.message, error.statusCode);
  throw error;
};

export const checkoutCart = asyncHandler(async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return sendError(res, "Thiếu dữ liệu thanh toán", 400);
    }
    const result = await checkoutCartItems(
      req.user.id,
      req.body.selectedItems,
      req.body.paymentMethod,
      req,
    );
    return sendSuccess(res, "Tạo thanh toán thành công", result);
  } catch (error) {
    return handlePaymentError(res, error);
  }
});

export const getCartPayment = asyncHandler(async (req, res) => {
  try {
    const payment = await getPaymentForUser(req.params.paymentId, req.user.id);
    return sendSuccess(res, "Lấy thông tin thanh toán thành công", payment);
  } catch (error) {
    return handlePaymentError(res, error);
  }
});
