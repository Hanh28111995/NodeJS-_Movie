import { bucket } from "../middleware/firebase.js";
import sharp from "sharp"; // 1. Import thư viện sharp

export const uploadToFirebase = async (file, folder) => {
  // Vì dùng memoryStorage, file nhận được sẽ có file.buffer thay vì file.path
  if (!file || !file.buffer) {
    throw new Error("Invalid file buffer for upload");
  }

  // 2. Đổi đuôi file gốc thành .webp và tạo tên file mới độc lập với thời gian
  const originalNameWithoutExt = file.originalname.substring(0, file.originalname.lastIndexOf('.')) || file.originalname;
  const fileName = `${Date.now()}_${originalNameWithoutExt}.webp`;
  const remotePath = `${folder}/${fileName}`;
  const fileRef = bucket.file(remotePath);

  // 3. Dùng sharp để nén và convert ảnh sang WebP trực tiếp trên RAM (buffer)
  const compressedBuffer = await sharp(file.buffer)
    .resize({ width: 1200, withoutEnlargement: true }) // Tùy chọn: Giới hạn chiều rộng tối đa, giữ nguyên nếu ảnh nhỏ hơn
    .webp({ quality: 80 }) // Nén chất lượng 80% và chuyển sang định dạng webp
    .toBuffer();

  // 4. Upload buffer đã nén trực tiếp lên Firebase Storage
  await fileRef.save(compressedBuffer, {
    metadata: { 
      contentType: "image/webp" // Đảm bảo content type chuẩn webp
    },
  });

  // 5. Cấp quyền public cho file để lấy URL công khai
  await fileRef.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;

  // Không cần dùng fs.unlinkSync(localPath) nữa vì không lưu file tạm trên ổ cứng!

  return { publicUrl, remotePath };
};

export const deleteFromFirebase = async (publicUrl) => {
  if (!publicUrl) return false;
  try {
    const oldRemotePath = publicUrl.split(`${bucket.name}/`)[1];
    if (oldRemotePath) {
      await bucket.file(oldRemotePath).delete();
      return true;
    }
    return false;
  } catch (err) {
    console.log("Failed to delete file from Firebase:", err.message);
    return false;
  }
};