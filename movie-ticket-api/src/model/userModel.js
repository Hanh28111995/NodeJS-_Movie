import mongoose from "mongoose";
import { nanoid } from "nanoid";
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer", // mặc định
    },
    userphone: {
      type: Number,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verifyToken: {
      type: String,
      trim: true,
      default: null, // chưa cần nhập
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "users", // specify the collection name here
  }
);

const User = mongoose.model("users", userSchema);

export default User;
