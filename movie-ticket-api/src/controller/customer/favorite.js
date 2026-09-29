import * as favoriteService from "../../service/favoriteService.js";

export const getProfile = (req, res) =>
  favoriteService.getProfile(res, req.user?.id || req.body.user_id);

export const toggleMovie = (req, res) =>
  favoriteService.toggleFavorite(res, req.user?.id || req.body.user_id, "favoriteMovies", req.params.movieId);

export const toggleCinema = (req, res) =>
  favoriteService.toggleFavorite(res, req.user?.id || req.body.user_id, "favoriteCinemas", req.params.cinemaId);