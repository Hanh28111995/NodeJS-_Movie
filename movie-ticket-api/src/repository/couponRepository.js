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

// Tăng usedCount, sau đó nếu usedCount >= maxUsage thì tự động chuyển active thành false (atomic update bằng pipeline)
export const deactivateIfUsedUp = async (id, maxUsage) => {
  // Bước 1: Tăng usedCount lên 1
  const updatedCoupon = await Coupons.findByIdAndUpdate(
    id,
    { $inc: { usedCount: 1 } },
    { new: true }
  );

  // Bước 2: Kiểm tra nếu vượt quá hoặc bằng maxUsage thì set active = false
  if (updatedCoupon && updatedCoupon.usedCount >= maxUsage) {
    return await Coupons.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );
  }

  return updatedCoupon;
};