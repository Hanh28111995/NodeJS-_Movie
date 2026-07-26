import express from "express";
import {
  cashConfirmPayment,
  checkTicketPaymentStatus,
  createVnpayPayment,
  vnpayReturn,
  createMomoPayment,
  momoReturn,
} from "../controller/payment/paymentController.js";

const paymentRouter = express.Router();

// Cash Payment
paymentRouter.post("/cash", cashConfirmPayment);

// Payment Status Check
paymentRouter.get("/status/:id", checkTicketPaymentStatus);

// VNPAY
paymentRouter.post("/create_vnpay", createVnpayPayment);
// paymentRouter.get("/return_vnpay", vnpayReturn);

// MOMO
paymentRouter.post("/create_momo", createMomoPayment);
// paymentRouter.get("/return_momo", momoReturn);

export default paymentRouter;
