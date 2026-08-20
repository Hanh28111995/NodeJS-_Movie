import {
  sendSuccess,
  sendError,
  sendServerError,
} from "../../helper/client.js";
import Banner from "../../model/bannerModel.js";
import Movie from "../../model/movieModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import {
  uploadToFirebase,
  deleteFromFirebase,
} from "../../helper/firebaseStorage.js";

export const getAllBanners = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [banners, total] = await Promise.all([
    Banner.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Banner.countDocuments(),
  ]);

  return sendSuccess(res, "All banners retrieved successfully", {
    banners,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const addBanner = asyncHandler(async (req, res) => {
  const { movie_id, highlight } = req.body;
  if (!movie_id) return sendError(res, "movie_id is required");

  const movie = await Movie.findOne({ _id: movie_id });
  if (!movie) return sendError(res, "Movie not found");

  if (!req.file) return sendError(res, "Banner image is required");

  const { publicUrl } = await uploadToFirebase(req.file, "banner");
  const newBanner = await Banner.create({ url: publicUrl, movie_id, highlight });
  return sendSuccess(res, "Banner added successfully", newBanner);
});

export const getBannerById = asyncHandler(async (req, res) => {
  const { bannerid } = req.params;
  const banner = await Banner.findById(bannerid).lean();
  if (!banner) return sendError(res, "Banner not found");
  return sendSuccess(res, "Banner retrieved successfully", banner);
});

export const updateBanner = asyncHandler(async (req, res) => {
  const { bannerid } = req.params;
  const banner = await Banner.findById(bannerid);
  if (!banner) return sendError(res, "Banner not found");

  const { movie_id } = req.body;
  const updateData = {};

  if (movie_id) {
    const movie = await Movie.findOne({ _id: movie_id });
    if (!movie) return sendError(res, "Movie not found");
    updateData.movie_id = movie_id;
  }

  if (req.file) {
    const { publicUrl } = await uploadToFirebase(req.file, "banner");
    updateData.url = publicUrl;
  }

  const updatedBanner = await Banner.findByIdAndUpdate(bannerid, updateData, {
    new: true,
  });

  if (req.file && banner.url) {
    await deleteFromFirebase(banner.url);
  }

  return sendSuccess(res, "Banner updated successfully", updatedBanner);
});

export const deleteBanner = asyncHandler(async (req, res) => {
  const { bannerid } = req.params;
  const banner = await Banner.findById(bannerid);
  if (!banner) return sendError(res, "Banner not found");

  if (banner.url) {
    await deleteFromFirebase(banner.url);
  }

  await Banner.findByIdAndDelete(bannerid);
  return sendSuccess(res, "Banner deleted successfully");
});
