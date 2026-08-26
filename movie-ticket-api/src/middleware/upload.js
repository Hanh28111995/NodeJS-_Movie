import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// Hàm factory tạo middleware với giới hạn dung lượng tùy chỉnh
const createHandleUpload = (maxSizeMB) => {
  const uploader = multer({
    storage: storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });

  return (req, res, next) => {
    uploader.single()(req, res, (err) => {
      if (err) {
        console.log("❌ Lỗi upload:", err.message);
        // Kiểm tra lỗi nếu file quá lớn
        const message = err.code === 'LIMIT_FILE_SIZE' ? `File size exceeds ${maxSizeMB}MB` : err.message;
        return res.status(400).json({ message });
      }
      
      if (req.files && req.files.length > 0) {
        req.file = req.files[0];
      }
      next();
    });
  };
};

// Định nghĩa các middleware với dung lượng khác nhau
export const handleUploadStandard = createHandleUpload(2); // Banner, Product: 2MB
export const handleUploadAvatar = createHandleUpload(0.5);  // Avatar: 0.5MB (500KB)

// Bạn có thể đặt tên tường minh tùy ý
export const handleUploadBanner = handleUploadStandard;
export const handleUploadPromotion = handleUploadStandard;
export const handleUploadShopProduct = handleUploadStandard;