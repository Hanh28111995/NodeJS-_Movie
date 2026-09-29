import mongoose from "mongoose";
import { nanoid } from "nanoid";

const favoriteUserSchema = new mongoose.Schema(
  {
    profile_id: {
      type: String,
      default: () => nanoid(10),
      unique: true,
      trim: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "ID người dùng là bắt buộc"],
      unique: true, 
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: [0, "Điểm tích lũy không được âm"],
    },
    membershipLevel: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
    },
    favoriteCinemas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cinemas", 
      },
    ],
    favoriteMovies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "movies", 
      },
    ],
  },
  {
    timestamps: true,
    collection: "favorite_users",
  }
);

favoriteUserSchema.index({ user_id: 1 });

const FavoriteUsers = mongoose.model("favorite_users", favoriteUserSchema);

export default FavoriteUsers;