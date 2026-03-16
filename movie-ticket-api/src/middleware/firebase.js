import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;
try {
  const sdkValue = process.env.FIREBASE_SDK;
  
  if (!sdkValue) {
    throw new Error("Biến môi trường FIREBASE_SDK không tồn tại.");
  }

  if (sdkValue.trim().startsWith("{")) {
    // Nếu là chuỗi JSON trực tiếp
    serviceAccount = JSON.parse(sdkValue);
  } else if (sdkValue.endsWith(".json")) {
    // Nếu là đường dẫn file
    const fileContent = fs.readFileSync(sdkValue, "utf8");
    serviceAccount = JSON.parse(fileContent);
  } else {
    throw new Error("Định dạng FIREBASE_SDK không hợp lệ (phải là JSON string hoặc đường dẫn .json)");
  }
} catch (error) {
  console.error("CRITICAL ERROR: Không thể tải cấu hình Firebase Admin SDK!");
  console.error("Chi tiết:", error.message);
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

