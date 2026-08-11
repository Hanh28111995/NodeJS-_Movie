import {
  getAllPromotions,
  addPromotion,
  updatePromotion,
  deletePromotion,
} from "../../controller/admin/promotion.js";
import express from "express";
import { handleUploadBanner } from "../../middleware/upload.js";

const adminPromotionRouter = express.Router();

adminPromotionRouter.get("/allPromotions", getAllPromotions);

adminPromotionRouter.post("/add", handleUploadBanner, addPromotion);

adminPromotionRouter.put("/update/:promotionid", handleUploadBanner, updatePromotion);

adminPromotionRouter.delete("/delete/:promotionid", deletePromotion);

export default adminPromotionRouter;
