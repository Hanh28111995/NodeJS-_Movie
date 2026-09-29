import mongoose from "mongoose";
import { nanoid } from "nanoid";

const movieSchema = new mongoose.Schema(
  {
    id_movie: {
      type: String,
      default: () => nanoid(10),
      unique: true,
      trim: true,
    },
    trailer: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
      required: true,
    },
    showing: {
      type: Boolean,
      required: false,
    },
    coming: {
      type: Boolean,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    describe: {
      type: String,
      required: true,
    },
    director: {
      type: String,
      required: true,
    },
    cast: {
      type: [String],
      required: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    ageRating: {
      type: String,
      required: true,
      enum: ["P", "C13", "C16", "C18"], // Phân loại độ tuổi
      default: "P",
    },
    formats: {
      type: [String],
      required: true, // Các định dạng phim hỗ trợ: 2D, 3D, IMAX,...
      default: ["2D"],
    },
  },
  {
    timestamps: true,
    collection: "movies",
  }
);

movieSchema.index({ title: "text", genre: "text" });
movieSchema.index({ releaseDate: -1 });

const Movies = mongoose.model("movies", movieSchema);

export default Movies;