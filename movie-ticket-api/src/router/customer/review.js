import { Router } from "express";
import * as reviewController from "../../controller/customer/review.js";

const customerReviewRouter = Router();
customerReviewRouter.get("/movie/:movieId", reviewController.getReviews);
customerReviewRouter.post("/create", reviewController.createReview);
customerReviewRouter.put("/:id", reviewController.updateReview);
customerReviewRouter.delete("/:id", reviewController.deleteReview);
export default customerReviewRouter;