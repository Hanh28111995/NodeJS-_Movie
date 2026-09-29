import Reviews from "../model/reviewModel.js";

export const getByMovie = (movieId) =>
  Reviews.find({ movie_id: movieId })
    .populate("user_id", "username avatar")
    .sort({ createdAt: -1 });

export const getByUserAndMovie = (userId, movieId) =>
  Reviews.findOne({ user_id: userId, movie_id: movieId });

export const createReview = (data) => Reviews.create(data);
export const updateReview = (id, data) => Reviews.findByIdAndUpdate(id, data, { new: true });
export const deleteReview = (id) => Reviews.findByIdAndDelete(id);

export const getAvgRating = (movieId) =>
  Reviews.aggregate([
    { $match: { movie_id: movieId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);