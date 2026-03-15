import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync(
    process.env.FIREBASE_SDK || "./nodejs-upload-demo-firebase-adminsdk-fbsvc-adc899e8c8.json",
    "utf8"
  )
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "nodejs-upload-demo.firebasestorage.app",
});
const bucket = admin.storage().bucket();
const auth = admin.auth();
export { bucket, auth };

