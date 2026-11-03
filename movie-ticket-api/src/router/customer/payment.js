import express from "express";
import {
  checkoutCart,
  getCartPayment,
} from "../../controller/payment/cartPaymentController.js";

const customerPaymentRouter = express.Router();

customerPaymentRouter.post("/checkout", checkoutCart);
customerPaymentRouter.get("/:paymentId", getCartPayment);

export default customerPaymentRouter;
