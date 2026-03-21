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
paymentRouter.post("/create_vnpay", verifyToken, createVnpayPayment);
paymentRouter.get("/return_vnpay", vnpayReturn);

// MOMO
paymentRouter.post("/create_momo", verifyToken, createMomoPayment);
paymentRouter.get("/return_momo", momoReturn);

export default paymentRouter;
