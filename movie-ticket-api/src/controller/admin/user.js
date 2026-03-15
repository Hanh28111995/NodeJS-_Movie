import { submitNewUser } from "../../validation/index.js";
import User from "../../model/userModel.js";
import bcrypt from "bcryptjs";
import {
  sendServerError,
  sendSuccess,
  sendError,
} from "../../helper/client.js";

export const getAllUser = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) return sendError(res, "No users found");
    return sendSuccess(res, "All users retrieved successfully", users);
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userid } = req.params;
    const user = await User.findById(userid);
    if (!user) return sendError(res, "User not found");
    return sendSuccess(res, "User found", user);
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};

export const addNewUser = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    // Validate dữ liệu (giống phần bạn đã có)
    const validate = submitNewUser(req.body);
    if (validate) return sendError(res, "Invalid input data", 400);

    // Kiểm tra username trùng
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      const field = existingUser.username === username ? "Username" : "Email";
      return sendError(res, `${field} already exists`, 409);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user mới với password đã hash
    const newUser = await User.create({
      ...req.body,
      password: hashedPassword,
    });

    return sendSuccess(res, "User created successfully", {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    });
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userid } = req.params;
    const validate = submitNewUser(req.body);
    if (validate) return sendError(res, error);
    const updatedUser = await User.findByIdAndUpdate(userid, req.body, {
      new: true,
    });
    if (!updatedUser) return sendError(res, "User not found");
    return sendSuccess(res, "User updated successfully", updatedUser);
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userid } = req.params;
    const user = await User.findById(userid);
    if (!user) {
      return sendError(res, "User not found");
    }
    const deletedUser = await User.findByIdAndDelete(userid);
    return sendSuccess(res, "User deleted successfully");
  } catch (err) {
    console.log(err);
    sendServerError(res);
  }
};
