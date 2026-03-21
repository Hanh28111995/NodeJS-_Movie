import { PaymentService } from "../../service/payment/index.js";
import * as ticketService from "../../service/ticketService.js";
import { sendSuccess } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

// Cash: staff xác nhận thanh toán tại quầy
export const cashConfirmPayment = asyncHandler(async (req, res) => {
  return await PaymentService.cash.confirm(res, req.body);
});

// Check trạng thái vé
export const checkTicketPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await ticketService.getTicketById(id);
  return sendSuccess(res, "Trạng thái vé", { status: ticket?.paymentStatus });
});

// VNPay: tạo link thanh toán
export const createVnpayPayment = asyncHandler(async (req, res) => {
  return await PaymentService.vnpay.createPaymentUrl(res, req, req.body);
});

// VNPay: callback sau khi thanh toán (redirect về FE)
export const vnpayReturn = asyncHandler(async (req, res) => {
  return await PaymentService.vnpay.verifyReturn(res, req.query);
});

// MoMo: tạo link thanh toán
export const createMomoPayment = asyncHandler(async (req, res) => {
  return await PaymentService.momo.createPaymentUrl(res, req.body);
});

// MoMo: callback sau khi thanh toán (redirect về FE)
export const momoReturn = asyncHandler(async (req, res) => {
  return await PaymentService.momo.verifyReturn(res, req.query);
});
