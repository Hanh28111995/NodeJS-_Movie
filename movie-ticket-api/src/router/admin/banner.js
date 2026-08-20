import {
  getAllBanners,
  addBanner,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "../../controller/admin/banner.js";
import express from "express";
import { handleUploadBanner } from "../../middleware/upload.js";

const adminBannerRouter = express.Router();

adminBannerRouter.get("/all", getAllBanners);
adminBannerRouter.get("/:bannerid", getBannerById);

adminBannerRouter.post("/add", handleUploadBanner, addBanner);
adminBannerRouter.put("/update/:bannerid", handleUploadBanner, updateBanner);
adminBannerRouter.delete("/delete/:bannerid", deleteBanner);

export default adminBannerRouter;
