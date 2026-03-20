import express from "express";
import {
  cashConfirmPayment,
  checkTicketPaymentStatus,
  createVnpayPayment,
  vnpayReturn,
  createMomoPayment,
  momoReturn,
} from "../controller/payment/paymentController.js";
import { verifyToken } from "../middleware/index.js";

const paymentRouter = express.Router();

// Cash Payment
paymentRouter.post("/cash", verifyToken, cashConfirmPayment);

// Payment Status Check
paymentRouter.get("/status/:id", checkTicketPaymentStatus);

// VNPAY
paymentRouter.post("/vnpay/create-vnpay", verifyToken, createVnpayPayment);
paymentRouter.get("/vnpay/return", vnpayReturn);

// MOMO
paymentRouter.post("/momo/create-momo", verifyToken, createMomoPayment);
paymentRouter.get("/momo/return", momoReturn);

export default paymentRouter;
