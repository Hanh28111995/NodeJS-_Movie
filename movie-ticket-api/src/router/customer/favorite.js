import { Router } from "express";
import * as favoriteController from "../../controller/customer/favorite.js";

const customerFavoriteRouter = Router();
customerFavoriteRouter.get("/profile", favoriteController.getProfile);
customerFavoriteRouter.post("/movies/:movieId/toggle", favoriteController.toggleMovie);
customerFavoriteRouter.post("/cinemas/:cinemaId/toggle", favoriteController.toggleCinema);
export default customerFavoriteRouter;