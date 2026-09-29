import * as couponRepository from "../repository/couponRepository.js";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";

// Tính discount, hỗ trợ check owner_id và minSubtotal
export const calculateDiscount = async (code, subtotal, userId) => {
  if (!code) return 0;
  const coupon = await couponRepository.getCouponByCode(code);
  if (!coupon) throw new Error("COUPON_NOT_FOUND");
  if (!coupon.active) throw new Error("COUPON_INACTIVE");
  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) throw new Error("COUPON_EXPIRED");
  if (coupon.usedCount >= (coupon.maxUsage ?? Infinity)) throw new Error("COUPON_USED_UP");
  if (coupon.owner_id && String(coupon.owner_id) !== String(userId)) throw new Error("COUPON_OWNER_MISMATCH");
  if (subtotal < coupon.minSubtotal) throw new Error("COUPON_MIN_SUBTOTAL");
  return Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount);
};

export const validateCoupon = async (res, code, subtotal, userId) => {
  try {
    const discount = await calculateDiscount(code, subtotal, userId);
    return sendSuccess(res, "Mã giảm giá hợp lệ", { code, discount });
  } catch (err) {
    const errorMessages = {
      COUPON_NOT_FOUND: "Mã không tồn tại",
      COUPON_INACTIVE: "Mã đã ngừng hoạt động",
      COUPON_EXPIRED: "Mã đã hết hạn",
      COUPON_USED_UP: "Mã đã hết lượt sử dụng",
      COUPON_OWNER_MISMATCH: "Mã giảm giá không thuộc về bạn",
      COUPON_MIN_SUBTOTAL: "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã"
    };
    return sendError(res, errorMessages[err.message] || "Lỗi xử lý mã", 400);
  }
};

// ---- Xử lý trong Checkout / Payment ----
export const releaseCouponHold = async (code, userId) => {
  if (!code) return;
  // TODO: Xóa giữ chỗ trên Redis nếu có
};

export const consumeCoupon = async (code, userId) => {
  if (!code) return;
  await releaseCouponHold(code, userId);
  const coupon = await couponRepository.getCouponByCode(code);
  if (!coupon) return;
  // Tăng usedCount, tự động tắt active nếu dùng đủ maxUsage[cite: 5]
  await couponRepository.deactivateIfUsedUp(coupon._id, coupon.maxUsage);
};

export const releaseCouponHoldOnly = async (code, userId) => {
  if (!code) return;
  await releaseCouponHold(code, userId); // Không tăng usedCount khi thất bại/hủy[cite: 5]
};

// ---- Admin CRUD ----
export const listCoupons = async (res) => {
  try {
    const coupons = await couponRepository.getAllCoupons();
    return sendSuccess(res, "Lấy danh sách mã giảm giá thành công", coupons);
  } catch { return sendServerError(res); }
};

export const createNewCoupon = async (res, data) => {
  try {
    if (new Date(data.endDate) <= new Date(data.startDate))
      return sendError(res, "endDate phải sau startDate", 400);
    const coupon = await couponRepository.createCoupon(data);
    return sendSuccess(res, "Tạo mã giảm giá thành công", coupon);
  } catch { return sendServerError(res); }
};

export const updateExistingCoupon = async (res, id, data) => {
  try {
    const currentCoupon = await couponRepository.getAllCoupons().then(list => list.find(c => c._id.toString() === id));
    if (!currentCoupon) return sendError(res, "Không tìm thấy mã", 404);

    if (data.code && data.code.toUpperCase() !== currentCoupon.code && currentCoupon.usedCount > 0) {
      return sendError(res, "Chỉ được đổi code khi mã chưa được sử dụng lần nào (usedCount === 0)", 400);
    }

    const coupon = await couponRepository.updateCoupon(id, data);
    return sendSuccess(res, "Cập nhật thành công", coupon);
  } catch { return sendServerError(res); }
};

// Tái kích hoạt mã giảm giá theo yêu cầu bước 3[cite: 4]
export const reactivateCouponService = async (res, id) => {
  try {
    const coupons = await couponRepository.getAllCoupons();
    const coupon = coupons.find(c => c._id.toString() === id);
    if (!coupon) return sendError(res, "Không tìm thấy mã giảm giá", 404);

    // Kiểm tra ràng buộc: chỉ khi usedCount < maxUsage mới cho bật lại[cite: 4]
    if (coupon.usedCount >= coupon.maxUsage) {
      return sendError(res, "Không thể bật lại vì mã đã dùng hết số lượt cho phép", 400);
    }

    const updated = await couponRepository.reactivateCoupon(id);
    return sendSuccess(res, "Tái kích hoạt mã giảm giá thành công", updated);
  } catch { return sendServerError(res); }
};

export const removeCoupon = async (res, id) => {
  try {
    await couponRepository.deleteCoupon(id);
    return sendSuccess(res, "Xóa mã giảm giá thành công", null);
  } catch { return sendServerError(res); }
};