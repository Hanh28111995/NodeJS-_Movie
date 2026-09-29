import * as reviewRepository from "../repository/reviewRepository.js";
import { sendError, sendSuccess, sendServerError } from "../helper/client.js";

export const listByMovie = async (res, movieId) => {
  try {
    const [reviews, stats] = await Promise.all([
      reviewRepository.getByMovie(movieId),
      reviewRepository.getAvgRating(movieId),
    ]);
    return sendSuccess(res, "Lấy đánh giá thành công", {
      reviews,
      avgRating: stats[0]?.avg ?? 0,
      count: stats[0]?.count ?? 0,
    });
  } catch { return sendServerError(res); }
};

export const createNewReview = async (res, body) => {
  try {
    const { user_id, movie_id, rating, comment } = body;
    if (!user_id || !movie_id || !rating || !comment)
      return sendError(res, "Thiếu thông tin đánh giá", 400);

    const existing = await reviewRepository.getByUserAndMovie(user_id, movie_id);
    if (existing)
      return sendError(res, "Bạn đã đánh giá phim này rồi", 400);

    const review = await reviewRepository.createReview({ user_id, movie_id, rating, comment });
    return sendSuccess(res, "Đánh giá thành công", review);
  } catch { return sendServerError(res); }
};

export const editReview = async (res, id, body, currentUserId) => {
  try {
    const review = await reviewRepository.updateReview(id, body);
    if (!review) return sendError(res, "Không tìm thấy đánh giá", 404);
    return sendSuccess(res, "Cập nhật đánh giá thành công", review);
  } catch { return sendServerError(res); }
};

export const removeReview = async (res, id) => {
  try {
    await reviewRepository.deleteReview(id);
    return sendSuccess(res, "Xóa đánh giá thành công", null);
  } catch { return sendServerError(res); }
};