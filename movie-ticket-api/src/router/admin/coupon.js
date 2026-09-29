import { Router } from "express";
import * as couponController from "../../controller/admin/coupon.js";

const adminCouponRouter = Router();
adminCouponRouter.get("/all", couponController.getCoupons);
adminCouponRouter.post("/create", couponController.createCoupon);
adminCouponRouter.put("/:id", couponController.updateCoupon);
adminCouponRouter.delete("/:id", couponController.deleteCoupon);
export default adminCouponRouter;