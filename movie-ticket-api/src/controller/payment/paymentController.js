import { PaymentService } from "../../service/payment/index.js";
import * as ticketService from "../../service/ticketService.js";
import { sendSuccess } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";

/**
 * @desc    Nhân viên xác nhận thanh toán bằng tiền mặt
 * @route   POST /api/payment/cash
 */
export const cashConfirmPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.cash.createPaymentUrl(res, req.body);
  return result;
});

// --- Check payment status ---

export const checkTicketPaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await ticketService.getTicketById(id);
  return sendSuccess(res, "Trạng thái vé", { status: ticket.paymentStatus });
});

// --- VNPAY CONTROLLERS ---

export const createVnpayPayment = asyncHandler(async (req, res) => {
  const ticket = req.body;
  return PaymentService.vnpay.createPaymentUrl(res, req, ticket);
});

export const vnpayReturn = asyncHandler(async (req, res) => {
  const result = await PaymentService.vnpay.verifyResponse(res, req.query);
  return result;
});

// --- MOMO CONTROLLERS ---

export const createMomoPayment = asyncHandler(async (req, res) => {
  const ticket = req.body;
  return await PaymentService.momo.createPaymentUrl(res, ticket);
});

export const momoReturn = asyncHandler(async (req, res) => {
  const result = await PaymentService.momo.verifyResponse(res, req.query);
  return result;
});
