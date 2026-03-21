import { PaymentService } from "../../service/payment/index.js";
import * as ticketService from "../../service/ticketService.js";
import { sendSuccess, sendError } from "../../helper/client.js";
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

// VNPay: tạo link thanh toán — FE gửi { _id: ticketId }
export const createVnpayPayment = asyncHandler(async (req, res) => {
  const ticketId = req.body._id || req.body.id;
  if (!ticketId) return sendError(res, "Thiếu ticket id", 400);
  const ticket = await ticketService.getTicketById(ticketId);
  if (!ticket) return sendError(res, "Không tìm thấy vé", 404);
  return await PaymentService.vnpay.createPaymentUrl(res, req, ticket);
});

// VNPay: callback sau khi thanh toán (redirect về FE)
export const vnpayReturn = asyncHandler(async (req, res) => {
  return await PaymentService.vnpay.verifyReturn(res, req.query);
});

// MoMo: tạo link thanh toán — FE gửi { _id: ticketId }
export const createMomoPayment = asyncHandler(async (req, res) => {
  const ticketId = req.body._id || req.body.id;
  if (!ticketId) return sendError(res, "Thiếu ticket id", 400);
  const ticket = await ticketService.getTicketById(ticketId);
  if (!ticket) return sendError(res, "Không tìm thấy vé", 404);
  return await PaymentService.momo.createPaymentUrl(res, ticket);
});

// MoMo: callback sau khi thanh toán (redirect về FE)
export const momoReturn = asyncHandler(async (req, res) => {
  return await PaymentService.momo.verifyReturn(res, req.query);
});
