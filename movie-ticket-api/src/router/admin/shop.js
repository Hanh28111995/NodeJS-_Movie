import {
  getAllShops,
  addShop,
  updateShop,
  deleteShop,
} from "../../controller/admin/shop.js";
import express from "express";
import { handleUploadShopProduct } from "../../middleware/upload.js";

const adminShopRouter = express.Router();

adminShopRouter.get("/all", getAllShops);

adminShopRouter.get("/:shopid", getShopProductDetail);

adminShopRouter.post("/add", handleUploadShopProduct, addShop);

adminShopRouter.put("/update/:shopid", handleUploadShopProduct, updateShop);

adminShopRouter.delete("/delete/:shopid", deleteShop);

export default adminShopRouter;
