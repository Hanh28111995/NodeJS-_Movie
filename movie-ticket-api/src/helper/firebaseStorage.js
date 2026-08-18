import fs from "fs";
import { bucket } from "../middleware/firebase.js";

export const uploadToFirebase = async (file, folder) => {
  const localPath = file.path;
  const remotePath = `${folder}/${Date.now()}_${file.originalname}`;
  const fileRef = bucket.file(remotePath);

  await bucket.upload(localPath, {
    destination: remotePath,
    metadata: { contentType: file.mimetype },
  });
  await fileRef.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;

  fs.unlinkSync(localPath);

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
