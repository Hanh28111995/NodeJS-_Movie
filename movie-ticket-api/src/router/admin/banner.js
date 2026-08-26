import {
  getAllBanners,
  addBanner,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "../../controller/admin/banner.js";
import express from "express";
import { handleUploadBanner } from "../../middleware/upload.js";
import { submitNewBanner } from "../../validation/index.js";

const adminBannerRouter = express.Router();

adminBannerRouter.get("/all", getAllBanners);
adminBannerRouter.get("/:bannerid", getBannerById);

adminBannerRouter.post(
  "/add",
  handleUploadBanner,
  validateBody(submitNewBanner),
  addBanner,
);
adminBannerRouter.put(
  "/update/:bannerid",
  handleUploadBanner,
  validateBody(submitNewBanner),
  updateBanner,
);
adminBannerRouter.delete("/delete/:bannerid", deleteBanner);

export default adminBannerRouter;
