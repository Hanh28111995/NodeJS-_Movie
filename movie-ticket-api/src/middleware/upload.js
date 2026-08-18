import multer from "multer";
import path from "path";

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = process.env.NODE_ENV === "production" ? `/tmp` : `src/upload/${folder}`;
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

const createHandleUpload = ({ folder, fieldName = "File", maxSizeMB = 2 }) => {
  const uploader = multer({
    storage: createStorage(folder),
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });

  return (req, res, next) => {
    uploader.single(fieldName)(req, res, (err) => {
      if (err) {
        console.log("❌ Lỗi upload:", err.message);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  };
};

export const handleUploadBanner = createHandleUpload({ folder: "banner" });
export const handleUploadPromotion = createHandleUpload({ folder: "promotions" });
export const handleUploadShopProduct = createHandleUpload({ folder: "shopProducts" });

export const uploadAvatar = multer({
  storage: createStorage("avatar"),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
