import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;
try {
  const sdkPath = process.env.FIREBASE_SDK;
  const fileContent = fs.readFileSync(sdkPath, "utf8");
  if (!fileContent || fileContent.trim() === "") {
    throw new Error(`File Firebase SDK rỗng hoặc không tồn tại tại: ${sdkPath}`);
  }
  serviceAccount = JSON.parse(fileContent);
} catch (error) {
  console.error("CRITICAL ERROR: Không thể tải cấu hình Firebase Admin SDK!");
  console.error("Chi tiết:", error.message);
  // Trong môi trường development, chúng ta có thể ném lỗi để dừng app
  // Trong production, bạn phải đảm bảo file này tồn tại và hợp lệ
  if (process.env.NODE_ENV === "production") {
    throw error;
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "nodejs-upload-demo.firebasestorage.app",
  });
}

const bucket = serviceAccount ? admin.storage().bucket() : null;
const auth = serviceAccount ? admin.auth() : null;
export { bucket, auth };

