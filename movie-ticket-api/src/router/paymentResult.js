import express from "express";
import {    
  vnpayReturn,  
  momoReturn,
} from "../controller/payment/paymentController.js";

const paymentResultRouter = express.Router();

paymentRouter.get("/return_vnpay", vnpayReturn);
paymentRouter.get("/return_momo", momoReturn);

export default paymentResultRouter;
