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
