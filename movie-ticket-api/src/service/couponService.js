import * as couponRepository from "../repository/couponRepository.js";
import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import { releaseCouponHold } from "./couponHoldService.js";

const POINT_TO_VND_RATE = 1000; // 1 điểm = 1.000đ (có thể lấy từ config/coupon nếu cần)

const isValidNumber = (val) =>
  val !== null && val !== undefined && val !== "" && !Number.isNaN(Number(val));

export const calculateDiscount = async (
  code,
  subtotal,
  userId,
  options = {},
) => {
  if (!code) return 0;

  const coupon = await couponRepository.getCouponByCode(code);
  if (!coupon) throw new Error("COUPON_NOT_FOUND");
  if (!coupon.active) throw new Error("COUPON_INACTIVE");

  const now = new Date();
  if (
    (coupon.startDate && now < new Date(coupon.startDate)) ||
    (coupon.endDate && now > new Date(coupon.endDate))
  ) {
    throw new Error("COUPON_EXPIRED");
  }

  if (coupon.usedCount >= (coupon.maxUsage ?? Infinity)) {
    throw new Error("COUPON_USED_UP");
  }

  if (coupon.owner_id && String(coupon.owner_id) !== String(userId)) {
    throw new Error("COUPON_OWNER_MISMATCH");
  }

  const cleanSubtotal = Number(subtotal);
  if (!Number.isFinite(cleanSubtotal) || cleanSubtotal < 0) {
    throw new Error("INVALID_SUBTOTAL");
  }

  const minSubtotal = isValidNumber(coupon.minSubtotal)
    ? Number(coupon.minSubtotal)
    : 0;
  if (cleanSubtotal < minSubtotal) {
    throw new Error("COUPON_MIN_SUBTOTAL");
  }

  let discountAmount = 0;

  // 1. Trường hợp giảm theo điểm (nếu type là "points" hoặc không có discountPercent)
  const isPointsMode =
    coupon.type === "points" || !isValidNumber(coupon.discountPercent);

  if (isPointsMode) {
    const rate = isValidNumber(coupon.pointValue)
      ? Number(coupon.pointValue)
      : POINT_TO_VND_RATE;

    // Số điểm muốn dùng: ưu tiên truyền từ options.pointsToUse, fallback sang coupon.points / userPoints nếu có
    const requestedPoints = isValidNumber(options.pointsToUse)
      ? Number(options.pointsToUse)
      : isValidNumber(coupon.points)
        ? Number(coupon.points)
        : 0;

    if (requestedPoints <= 0) {
      throw new Error("INVALID_POINTS");
    }

    if (
      isValidNumber(coupon.minPoints) &&
      requestedPoints < Number(coupon.minPoints)
    ) {
      throw new Error("INSUFFICIENT_MIN_POINTS");
    }

    const maxAllowedPoints = isValidNumber(options.userPoints)
      ? Math.max(0, Number(options.userPoints))
      : requestedPoints;

    let usablePoints = Math.min(requestedPoints, maxAllowedPoints);

    if (isValidNumber(coupon.maxPointsPerOrder)) {
      usablePoints = Math.min(usablePoints, Number(coupon.maxPointsPerOrder));
    }

    discountAmount = usablePoints * rate;

    if (isValidNumber(coupon.maxDiscount)) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  } else {
    // 2. Trường hợp giảm theo %
    const percent = Number(coupon.discountPercent);
    discountAmount = (cleanSubtotal * percent) / 100;

    if (isValidNumber(coupon.maxDiscount)) {
      discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
    }
  }

  // Không bao giờ vượt quá giá trị đơn hàng và không ra số âm / NaN
  const clampedDiscount = Math.min(Math.max(0, discountAmount), cleanSubtotal);
  return Math.round(clampedDiscount);
};

export const validateCoupon = async (
  res,
  code,
  subtotal,
  userId,
  options = {},
) => {
  try {
    const discount = await calculateDiscount(code, subtotal, userId, options);
    return sendSuccess(res, "Mã giảm giá hợp lệ", { code, discount });
  } catch (err) {
    const errorMessages = {
      COUPON_NOT_FOUND: "Mã không tồn tại",
      COUPON_INACTIVE: "Mã đã ngừng hoạt động",
      COUPON_EXPIRED: "Mã đã hết hạn",
      COUPON_USED_UP: "Mã đã hết lượt sử dụng",
      COUPON_OWNER_MISMATCH: "Mã giảm giá không thuộc về bạn",
      COUPON_MIN_SUBTOTAL: "Đơn hàng chưa đạt giá trị tối thiểu để dùng mã",
      INVALID_SUBTOTAL: "Giá trị đơn hàng không hợp lệ",
      INVALID_POINTS: "Số điểm sử dụng không hợp lệ",
      INSUFFICIENT_MIN_POINTS: "Chưa đạt số điểm tối thiểu để quy đổi",
    };
    return sendError(res, errorMessages[err.message] || "Lỗi xử lý mã", 400);
  }
};

export const consumeCoupon = async (code, userId) => {
  if (!code) return;
  const coupon = await couponRepository.getCouponByCode(code);
  if (!coupon) return;
  await couponRepository.deactivateIfUsedUp(coupon._id, coupon.maxUsage);
  await releaseCouponHold(code, userId); // giải phóng sau cùng
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
  } catch {
    return sendServerError(res);
  }
};

export const createNewCoupon = async (res, data) => {
  try {
    if (new Date(data.endDate) <= new Date(data.startDate))
      return sendError(res, "endDate phải sau startDate", 400);
    const coupon = await couponRepository.createCoupon(data);
    return sendSuccess(res, "Tạo mã giảm giá thành công", coupon);
  } catch {
    return sendServerError(res);
  }
};

export const updateExistingCoupon = async (res, id, data) => {
  try {
    const currentCoupon = await couponRepository
      .getAllCoupons()
      .then((list) => list.find((c) => c._id.toString() === id));
    if (!currentCoupon) return sendError(res, "Không tìm thấy mã", 404);

    if (
      data.code &&
      data.code.toUpperCase() !== currentCoupon.code &&
      currentCoupon.usedCount > 0
    ) {
      return sendError(
        res,
        "Chỉ được đổi code khi mã chưa được sử dụng lần nào (usedCount === 0)",
        400,
      );
    }

    const coupon = await couponRepository.updateCoupon(id, data);
    return sendSuccess(res, "Cập nhật thành công", coupon);
  } catch {
    return sendServerError(res);
  }
};

// Tái kích hoạt mã giảm giá theo yêu cầu bước 3[cite: 4]
export const reactivateCouponService = async (res, id) => {
  try {
    const coupons = await couponRepository.getAllCoupons();
    const coupon = coupons.find((c) => c._id.toString() === id);
    if (!coupon) return sendError(res, "Không tìm thấy mã giảm giá", 404);

    // Kiểm tra ràng buộc: chỉ khi usedCount < maxUsage mới cho bật lại[cite: 4]
    if (coupon.usedCount >= coupon.maxUsage) {
      return sendError(
        res,
        "Không thể bật lại vì mã đã dùng hết số lượt cho phép",
        400,
      );
    }

    const updated = await couponRepository.reactivateCoupon(id);
    return sendSuccess(res, "Tái kích hoạt mã giảm giá thành công", updated);
  } catch {
    return sendServerError(res);
  }
};

export const removeCoupon = async (res, id) => {
  try {
    await couponRepository.deleteCoupon(id);
    return sendSuccess(res, "Xóa mã giảm giá thành công", null);
  } catch {
    return sendServerError(res);
  }
};
