import * as couponRepository from "../repository/couponRepository.js";
import { sendError, sendServerError } from "../helper/client.js";

// Validate + trả discount tuyệt đối; dùng chung ở orderService
export const calculateDiscount = async (code, subtotal) => {
  if (!code) return 0;
  const coupon = await couponRepository.getCouponByCode(code);
  if (!coupon) throw new Error("COUPON_NOT_FOUND");
  if (!coupon.active) throw new Error("COUPON_INACTIVE");
  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) throw new Error("COUPON_EXPIRED");
  return Math.min((subtotal * coupon.discountPercent) / 100, coupon.maxDiscount);
};

export const validateCoupon = async (res, code, subtotal) => {
  try {
    const discount = await calculateDiscount(code, subtotal);
    return sendSuccess(res, "Mã giảm giá hợp lệ", { code, discount });
  } catch (err) {
    return sendError(res, { COUPON_NOT_FOUND: "Mã không tồn tại", COUPON_INACTIVE: "Mã đã ngừng hoạt động", COUPON_EXPIRED: "Mã đã hết hạn" }[err.message] || "Lỗi xử lý mã", 400);
  }
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
    const coupon = await couponRepository.updateCoupon(id, data);
    if (!coupon) return sendError(res, "Không tìm thấy mã", 404);
    return sendSuccess(res, "Cập nhật thành công", coupon);
  } catch { return sendServerError(res); }
};

export const removeCoupon = async (res, id) => {
  try {
    await couponRepository.deleteCoupon(id);
    return sendSuccess(res, "Xóa mã giảm giá thành công", null);
  } catch { return sendServerError(res); }
};