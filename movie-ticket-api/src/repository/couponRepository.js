import Coupons from "../model/couponModel.js";

// ==========================================
// 1. Admin quản lý coupon
// ==========================================
export const getAllCoupons = () => Coupons.find().sort({ createdAt: -1 });

export const createCoupon = (data) => Coupons.create(data);

export const updateCoupon = (id, data) => 
  Coupons.findByIdAndUpdate(id, data, { new: true });

export const deleteCoupon = (id) => Coupons.findByIdAndDelete(id);


// ==========================================
// 2. Tái kích hoạt / đổi trạng thái
// ==========================================
export const reactivateCoupon = (id) => 
  Coupons.findByIdAndUpdate(id, { active: true }, { new: true });


// ==========================================
// 3. Dùng trong quá trình Checkout
// ==========================================
export const getCouponByCode = (code) => 
  Coupons.findOne({ code: code.toUpperCase() });

export const incrementUsedCount = (id) =>
  Coupons.findByIdAndUpdate(id, { $inc: { usedCount: 1 } }, { new: true });

export const deactivateIfUsedUp = (id, maxUsage) =>
  Coupons.findByIdAndUpdate(
    id,
    [{
      $set: {
        usedCount: { $add: ["$usedCount", 1] },
        active: { $cond: [{ $gte: [{ $add: ["$usedCount", 1] }, maxUsage] }, false, "$active"] },
      },
    }],
    { new: true },
  );