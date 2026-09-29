import * as couponService from "../../service/couponService.js";

export const getCoupons = (req, res) => couponService.listCoupons(res);
export const createCoupon = (req, res) => couponService.createNewCoupon(res, req.body);
export const updateCoupon = (req, res) => couponService.updateExistingCoupon(res, req.params.id, req.body);
export const deleteCoupon = (req, res) => couponService.removeCoupon(res, req.params.id);