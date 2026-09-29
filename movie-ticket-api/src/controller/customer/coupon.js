import * as couponService from "../../service/couponService.js";

export const validateCoupon = (req, res) =>
  couponService.validateCoupon(res, req.body.code, req.body.subtotal);