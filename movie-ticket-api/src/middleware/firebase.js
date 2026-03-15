import admin from "firebase-admin";
import fs from "fs";

let serviceAccount;
try {
  const sdkValue = process.env.FIREBASE_SDK;
  
  if (!sdkValue) {
    throw new Error("Biến môi trường FIREBASE_SDK không tồn tại.");
  }

  // Kiểm tra nếu giá trị là một đường dẫn file (kết thúc bằng .json)
  if (sdkValue.endsWith(".json")) {
    const fileContent = fs.readFileSync(sdkValue, "utf8");
    serviceAccount = JSON.parse(fileContent);
  } else {
    // Nếu không phải file, giả định nó là chuỗi JSON trực tiếp
    serviceAccount = JSON.parse(sdkValue);
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

