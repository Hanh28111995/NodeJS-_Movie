import multer from "multer";
import path from "path";

// Thiết lập nơi lưu + tên file

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

// Chỉ nhận ảnh
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

const uploadBanner = multer({
  storage: createStorage("banner"),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
});

export const handleUploadBanner = (req, res, next) => {
  uploadBanner.single("File")(req, res, (err) => {
    if (err) {
      console.log("❌ Lỗi upload:", err.message);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

export const uploadAvatar = multer({
  storage: createStorage("avatar"),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // Giới hạn 2MB
});
