import {
  sendError,
  sendServerError,
  sendSuccess,
} from "../../helper/client.js";
import fs from "fs";
import { bucket } from "../../middleware/firebase.js";
import Movies from "../../model/movieModel.js";

export const uploadBannerController = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded");
    }
    const localPath = req.file.path;
    const remotePath = `banner/${req.file.originalname}`;
    const file = bucket.file(remotePath);

    // Upload to Firebase
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: { contentType: req.file.mimetype },
    });

    // create URL public
    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;

    // delete file
    fs.unlinkSync(localPath);

    const updatedMovie = await Movies.findOneAndUpdate(
      { id_movie: req.body.id_movie },
      { banner: url },
      { new: true }
    );
    if (!updatedMovie) return sendError(res, "Movie not found");
    return sendSuccess(res, "Banner uploaded successfully", { url });
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};

export const uploadAvatarController = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, "No file uploaded");
    }
    const localPath = req.file.path;
    const remotePath = `banner/${req.file.filename}`;
    const file = bucket.file(remotePath);

    // Upload to Firebase
    await bucket.upload(localPath, {
      destination: remotePath,
      metadata: { contentType: req.file.mimetype },
    });

    // create URL public
    await file.makePublic();
    const url = `https://storage.googleapis.com/${bucket.name}/${remotePath}`;

    // delete file
    fs.unlinkSync(localPath);
    return sendSuccess(res, "Avatar uploaded successfully", { url });
  } catch (err) {
    console.log(err);
    return sendServerError(res);
  }
};
