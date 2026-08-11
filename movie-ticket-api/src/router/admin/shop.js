import {
  getAllShops,
  addShop,
  updateShop,
  deleteShop,
} from "../../controller/admin/shop.js";
import express from "express";
import { handleUploadBanner } from "../../middleware/upload.js";

const adminShopRouter = express.Router();

adminShopRouter.get("/allShops", getAllShops);

adminShopRouter.post("/add", handleUploadBanner, addShop);

adminShopRouter.put("/update/:shopid", handleUploadBanner, updateShop);

adminShopRouter.delete("/delete/:shopid", deleteShop);

export default adminShopRouter;
