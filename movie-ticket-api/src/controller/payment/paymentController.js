import { PaymentService } from "../../service/payment/index.js";
import * as ticketService from "../../service/ticketService.js";
import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import {
  completeCartPayment,
  confirmCashCartPayment,
  failCartPayment,
  getCartPaymentByTransactionRef,
} from "../../service/payment/cartPaymentService.js";
import {
  paymentRedirect,
  verifyMomoReturn,
  verifyVnpayReturn,
} from "../../service/payment/cartPaymentGateway.js";

// Cash: staff xác nhận thanh toán tại quầy
export const cashConfirmPayment = asyncHandler(async (req, res) => {
  if (!["staff", "admin"].includes(req.user?.role)) {
    return sendError(res, "Chỉ staff hoặc admin mới được xác nhận tiền mặt", 403);
  }
  const ticketId = req.body?.id || req.body?._id;
  if (!ticketId) return sendError(res, "Thiếu ticket id", 400);
  const ticket = await ticketService.getTicketById(ticketId);
  if (ticket.payment_id) {
    return sendError(res, "Vé đang được giữ trong một thanh toán cart", 409);
  }
  return await PaymentService.cash.confirm(res, req.body);
});

export const confirmCartCashPayment = asyncHandler(async (req, res) => {
  if (!["staff", "admin"].includes(req.user?.role)) {
    return sendError(res, "Chỉ staff hoặc admin mới được xác nhận tiền mặt", 403);
  }
  const payment = await confirmCashCartPayment(
    req.params.paymentId,
    req.user.id,
  );
  if (!payment) return sendError(res, "Không tìm thấy thanh toán tiền mặt đang chờ", 404);
  return sendSuccess(res, "Xác nhận thanh toán tiền mặt thành công", payment);
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
  if (ticket.payment_id) {
    return sendError(res, "Vé đang được giữ trong một thanh toán cart", 409);
  }
  return await PaymentService.vnpay.createPaymentUrl(res, req, ticket);
});

// VNPay: callback sau khi thanh toán (redirect về FE)
export const vnpayReturn = asyncHandler(async (req, res) => {
  if (String(req.query.vnp_TxnRef || "").startsWith("PAY_")) {
    return handleCartVnpayReturn(res, req.query);
  }
  return await PaymentService.vnpay.verifyReturn(res, req.query);
});

// MoMo: tạo link thanh toán — FE gửi { _id: ticketId }
export const createMomoPayment = asyncHandler(async (req, res) => {
  const ticketId = req.body._id || req.body.id;
  if (!ticketId) return sendError(res, "Thiếu ticket id", 400);
  const ticket = await ticketService.getTicketById(ticketId);
  if (!ticket) return sendError(res, "Không tìm thấy vé", 404);
  if (ticket.payment_id) {
    return sendError(res, "Vé đang được giữ trong một thanh toán cart", 409);
  }
  return await PaymentService.momo.createPaymentUrl(res, ticket);
});

// MoMo: callback sau khi thanh toán (redirect về FE)
export const momoReturn = asyncHandler(async (req, res) => {
  if (String(req.query.orderId || "").startsWith("PAY_")) {
    return handleCartMomoReturn(res, req.query);
  }
  return await PaymentService.momo.verifyReturn(res, req.query);
});

const handleCartVnpayReturn = async (res, query) => {
  const reference = query.vnp_TxnRef;
  if (!verifyVnpayReturn(query)) {
    return res.redirect(paymentRedirect("failed", { reason: "invalid_signature" }));
  }
  const payment = await getCartPaymentByTransactionRef(reference);
  if (!payment || Number(query.vnp_Amount) / 100 !== payment.totalAmount) {
    return res.redirect(paymentRedirect("error", { reason: "invalid_payment" }));
  }

  if (query.vnp_ResponseCode === "00") {
    if (!query.vnp_TransactionNo) {
      return res.redirect(
        paymentRedirect("error", { reason: "missing_transaction_id" }),
      );
    }
    const completed = await completeCartPayment(payment._id, {
      method: "VNPAY",
      transactionId: String(query.vnp_TransactionNo),
      amount: Number(query.vnp_Amount) / 100,
    });
    return res.redirect(
      paymentRedirect(completed ? "success" : "error", {
        method: "vnpay",
        paymentId: payment.paymentId,
      }),
    );
  }

  await failCartPayment(payment._id, "VNPAY");
  return res.redirect(
    paymentRedirect("failed", {
      method: "vnpay",
      paymentId: payment.paymentId,
      code: String(query.vnp_ResponseCode || ""),
    }),
  );
};

const handleCartMomoReturn = async (res, query) => {
  if (!verifyMomoReturn(query)) {
    return res.redirect(paymentRedirect("failed", { reason: "invalid_signature" }));
  }
  const payment = await getCartPaymentByTransactionRef(query.orderId);
  if (!payment || Number(query.amount) !== payment.totalAmount) {
    return res.redirect(paymentRedirect("error", { reason: "invalid_payment" }));
  }

  if (String(query.resultCode) === "0") {
    if (!query.transId) {
      return res.redirect(
        paymentRedirect("error", { reason: "missing_transaction_id" }),
      );
    }
    const completed = await completeCartPayment(payment._id, {
      method: "MOMO",
      transactionId: String(query.transId),
      amount: Number(query.amount),
    });
    return res.redirect(
      paymentRedirect(completed ? "success" : "error", {
        method: "momo",
        paymentId: payment.paymentId,
      }),
    );
  }

  await failCartPayment(payment._id, "MOMO");
  return res.redirect(
    paymentRedirect("failed", {
      method: "momo",
      paymentId: payment.paymentId,
      code: String(query.resultCode || ""),
    }),
  );
};
