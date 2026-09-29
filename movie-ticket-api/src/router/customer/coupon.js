import { Router } from "express";
import * as couponController from "../../controller/customer/coupon.js";

const customerCouponRouter = Router();
customerCouponRouter.post("/validate", couponController.validateCoupon);
export default customerCouponRouter;