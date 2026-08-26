import { sendSuccess, sendError } from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import bannerService from "../../service/admin/bannerService.js";

/**
 * @desc Lấy toàn bộ danh sách banner (không phân trang, có Redis cache)
 */
export const getAllBanners = asyncHandler(async (req, res) => {
  const result = await bannerService.getAllBanners();
  return sendSuccess(res, "All banners retrieved successfully", result);
});

/**
 * @desc Lấy chi tiết một banner theo ID
 */
export const getBannerById = asyncHandler(async (req, res) => {
  try {
    const { bannerid } = req.params;
    const banner = await bannerService.getBannerById(bannerid);
    return sendSuccess(res, "Banner retrieved successfully", banner);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

/**
 * @desc Thêm mới một banner (kiểm tra movie, upload Firebase, xóa cache Redis)
 */
export const addBanner = asyncHandler(async (req, res) => {
  try {
    const { movie_id, highlight } = req.body;

    // Gọi sang Service xử lý logic nghiệp vụ
    const newBanner = await bannerService.addBanner(
      { movie_id, highlight },
      req.file,
    );

    return sendSuccess(res, "Banner added successfully", newBanner);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

/**
 * @desc Cập nhật thông tin banner (hỗ trợ đổi ảnh Firebase và đồng bộ Redis cache)
 */
export const updateBanner = asyncHandler(async (req, res) => {
  try {
    const { bannerid } = req.params;
    const { movie_id, highlight } = req.body;

    // Gọi sang Service xử lý cập nhật
    const updatedBanner = await bannerService.updateBanner(
      bannerid,
      { movie_id, highlight },
      req.file,
    );

    return sendSuccess(res, "Banner updated successfully", updatedBanner);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

/**
 * @desc Xóa banner (xóa ảnh cũ trên Firebase và dọn dẹp cache Redis)
 */
export const deleteBanner = asyncHandler(async (req, res) => {
  try {
    const { bannerid } = req.params;

    // Gọi sang Service xử lý xóa
    await bannerService.deleteBanner(bannerid);

    return sendSuccess(res, "Banner deleted successfully");
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});
