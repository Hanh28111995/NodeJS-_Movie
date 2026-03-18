import { sendError, sendSuccess } from "../helper/client.js";
import * as authService from "../service/authService.js";
import asyncHandler from "../util/asyncHandler.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  path: "/",
  sameSite: "None",
};

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  const { refreshToken, ...dataRes } = result;
  return sendSuccess(res, "Login successful", dataRes);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const accessToken = req.headers["authorization"]?.split(" ")[1];
  await authService.logout(refreshToken, accessToken);

  res.clearCookie("refreshToken", COOKIE_OPTIONS);

  return sendSuccess(res, "Đăng xuất thành công");
});

export const register = asyncHandler(async (req, res) => {
  const newUser = await authService.register(req.body);
  return sendSuccess(res, "User created successfully", {
    username: newUser.username,
    email: newUser.email,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  // 1. CHỈ lấy refreshToken từ Cookie (Chìa khóa 7 ngày của bạn)
  const rToken = req.cookies.refreshToken;

  if (!rToken) {
    // Nếu không có chìa khóa, bắt buộc phải login lại (401)
    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.",
    });
  }

  // 2. Gọi service để verify rToken và tạo Access Token mới (10 phút)
  // Lưu ý: Đảm bảo authService.refreshToken trả về chuỗi token nguyên bản
  const newAccessToken = await authService.refreshToken(rToken);

  // 3. Trả về đúng cấu trúc để FE dễ lấy (bọc trong 'content' nếu FE dùng res.data.content)
  return sendSuccess(res, "Access token refreshed successfully", {
    accessToken: newAccessToken,
  });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await authService.googleLogin(token);

  res.cookie("refreshToken", result.refreshToken, COOKIE_OPTIONS);

  const { refreshToken, ...dataRes } = result;
  return sendSuccess(res, "Google login successful", dataRes);
});
