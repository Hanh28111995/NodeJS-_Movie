import Coupons from "../model/couponModel.js";

export const getCouponByCode = (code) => Coupons.findOne({ code: code.toUpperCase() });
export const getAllCoupons = () => Coupons.find().sort({ createdAt: -1 });
export const createCoupon = (data) => Coupons.create(data);
export const updateCoupon = (id, data) => Coupons.findByIdAndUpdate(id, data, { new: true });
export const deleteCoupon = (id) => Coupons.findByIdAndDelete(id);
export const incrementUsedCount = (id) =>
  Coupons.findByIdAndUpdate(id, { $inc: { usedCount: 1 } }, { new: true });