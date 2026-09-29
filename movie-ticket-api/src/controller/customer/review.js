import * as reviewService from "../../service/reviewService.js";

export const getReviews = (req, res) => reviewService.listByMovie(res, req.params.movieId);
export const createReview = (req, res) => reviewService.createNewReview(res, { ...req.body, user_id: req.user?.id || req.body.user_id });
export const updateReview = (req, res) => reviewService.editReview(res, req.params.id, req.body, req.user?.id);
export const deleteReview = (req, res) => reviewService.removeReview(res, req.params.id);