import { sendError, sendServerError, sendSuccess } from "../helper/client.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../model/userModel.js";
import { submitNewUser } from "../validation/index.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // Add your authentication logic here
    const client = await User.findOne({ username });
    if (!client) return sendError(res, "username does not exist", 404);
    const isMatch = await bcrypt.compare(password, client?.password);
    if (!isMatch) return sendError(res, "Incorrect password", 401);

    // Create JWT token
    const token = jwt.sign(
      {
        user: {
          id: client.user_id,
          username: client.username,
          role: client.role,
        },
      },
      JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    return sendSuccess(res, "Login successful", {
      user_inf: {
         username: client.username,
         email: client.email,
         role: client.role,          
      },
      user_token: token,
    });
  } catch (err) {    
    return sendServerError(res);
  }
};

export const logout = async (req, res) => {
  try {
    return sendSuccess(res, "Logout successful");
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
};

export const register = async (req, res) => {
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
      role: "customer",
    });

    return sendSuccess(res, "User created successfully", {
      username: newUser.username,
      email: newUser.email,
    });
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
};

export const refreshToken = (req, res) => {
  try {
    // 🔹 Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

    if (!token) {
      return sendError(res, "Missing refresh token", 400);
    }

    // 🔹 Xác thực refresh token
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, user) => {
      if (err) {
        return sendError(res, "Invalid or expired refresh token", 403);
      }

      // 🔹 Tạo access token mới
      const newAccessToken = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET_KEY, // secret của access token
        { expiresIn: "1h" }
      );

      return sendSuccess(res, "Access token refreshed successfully", {
        accessToken: newAccessToken,
      });
    });
  } catch (err) {
    console.error(err);
    return sendServerError(res);
  }
};
