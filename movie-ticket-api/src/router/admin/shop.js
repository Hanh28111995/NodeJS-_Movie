import {
  getAllShops,
  addShop,
  updateShop,
  deleteShop,
  getShopProductDetail,
} from "../../controller/admin/shop.js";
import express from "express";
import { handleUploadShopProduct } from "../../middleware/upload.js";
import { validateBody } from "../../middleware/validation.js";
import { submitNewShopProduct } from "../../validation/index.js";

const adminShopRouter = express.Router();

adminShopRouter.get("/all", getAllShops);

adminShopRouter.get("/:shopid", getShopProductDetail);

adminShopRouter.post(
  "/add",
  handleUploadShopProduct,
  validateBody(submitNewShopProduct),
  addShop,
);

adminShopRouter.put(
  "/update/:shopid",
  handleUploadShopProduct,
  validateBody(submitNewShopProduct),
  updateShop,
);

adminShopRouter.delete("/delete/:shopid", deleteShop);

export default adminShopRouter;
