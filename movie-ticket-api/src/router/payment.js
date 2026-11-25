import express from "express";
import {
  cashConfirmPayment,
  checkTicketPaymentStatus,
  createVnpayPayment,
  vnpayReturn,
  createMomoPayment,
  momoReturn,
  confirmCartCashPayment,
} from "../controller/payment/paymentController.js";
import { verifyToken } from "../middleware/index.js";

const paymentRouter = express.Router();

// Cash Payment
paymentRouter.post("/cash", verifyToken, cashConfirmPayment);
paymentRouter.post(
  "/cart/:paymentId/cash/confirm",
  verifyToken,
  confirmCartCashPayment,
);

// Payment Status Check
paymentRouter.get("/status/:id", verifyToken, checkTicketPaymentStatus);

// VNPAY
paymentRouter.post("/create_vnpay", verifyToken, createVnpayPayment);
paymentRouter.get("/return_vnpay", vnpayReturn);

// MOMO
paymentRouter.post("/create_momo", verifyToken, createMomoPayment);
paymentRouter.get("/return_momo", momoReturn);

//check vercel connection

// Check MoMo Sandbox connection
paymentRouter.get("/test-momo", async (req, res) => {
  try {
    const endpoint = process.env.MOMO_ENDPOINT?.trim();

    if (!endpoint) {
      return res.status(500).json({
        success: false,
        message: "MOMO_ENDPOINT is not configured",
      });
    }

    const response = await fetch(endpoint, {
      method: "GET",
    });

    const rawData = await response.text();

    return res.status(200).json({
      success: true,
      momoStatus: response.status,
      contentType: response.headers.get("content-type"),
      response: rawData.slice(0, 500),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default paymentRouter;
