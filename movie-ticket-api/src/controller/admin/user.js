import {
  sendServerError,
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import { submitNewUser } from "../../validation/index.js";
import asyncHandler from "../../util/asyncHandler.js";
import User from "../../model/userModel.js";
import bcrypt from "bcryptjs";

// 1. Lấy danh sách hoặc Tìm kiếm người dùng (Đã gộp chung getAll và search)
export const getAllUser = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(8, parseInt(req.query.limit) || 8);
  const skip = (page - 1) * limit;

  // Lấy keyword/search sạch sẽ
  const keyword = (req.query.keyword || req.query.search || "").trim();

  // Xây dựng query tìm kiếm trực quan giống searchMovies
  let query = {};
  if (keyword) {
    const regex = { $regex: keyword, $options: "i" };
    query = {
      $or: [        
        { email: regex },
        { userphone: regex },
      ],
    };
  }

  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return sendSuccess(res, "Users retrieved successfully", {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const searchUser = getAllUser;


// 2. Lấy chi tiết user theo ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userid)
    .select("-password")
    .lean();
  if (!user) return sendError(res, "User not found", 404);
  return sendSuccess(res, "User found", user);
});

// 3. Tạo mới user
export const addNewUser = asyncHandler(async (req, res) => {
  const validate = submitNewUser(req.body);
  if (validate) return sendError(res, "Invalid input data", 400);

  const { username, password, email, role } = req.body;

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const field = existing.username === username ? "Username" : "Email";
    return sendError(res, `${field} already exists`, 409);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    password: hashedPassword,
    email,
    role,
  });

  return sendSuccess(res, "User created successfully", {
    id: newUser._id,
    username: newUser.username,
    email: newUser.email,
  });
});

// 4. Cập nhật user
export const updateUser = asyncHandler(async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.params.userid, req.body, {
    new: true,
  })
    .select("-password")
    .lean();

  if (!updated) return sendError(res, "User not found", 404);
  return sendSuccess(res, "User updated successfully", updated);
});

// 5. Xóa user
export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.userid).lean();
  if (!deleted) return sendError(res, "User not found", 404);
  return sendSuccess(res, "User deleted successfully");
});
