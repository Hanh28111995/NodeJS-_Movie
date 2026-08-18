import express from "express";
import { verifyAdmin, verifyCustomer } from "../../middleware/index.js";
import { handleUploadBanner, handleUploadAvatar } from "../../middleware/upload.js";
import { uploadAvatarController, uploadBannerController } from "../../controller/uploads/uploads.js";




const uploadRouter = express.Router();

uploadRouter.post("/banner", verifyAdmin,  handleUploadBanner, uploadBannerController);
uploadRouter.post("/avatar", verifyCustomer, handleUploadAvatar, uploadAvatarController);

export default uploadRouter;
