import {
  getAllPromotions,
  addPromotion,
  updatePromotion,
  deletePromotion,
  getPromotionDetail,
} from "../../controller/admin/promotion.js";
import express from "express";
import { handleUploadPromotion } from "../../middleware/upload.js";

const adminPromotionRouter = express.Router();

adminPromotionRouter.get("/all", getAllPromotions);

adminPromotionRouter.get("/:promotionid", getPromotionDetail);

adminPromotionRouter.post("/add", handleUploadPromotion, addPromotion);

adminPromotionRouter.put("/update/:promotionid", handleUploadPromotion, updatePromotion);

adminPromotionRouter.delete("/delete/:promotionid", deletePromotion);

export default adminPromotionRouter;
