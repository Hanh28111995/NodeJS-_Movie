import { sendError, sendSuccess } from "../helper/client.js";
import * as authService from "../service/authService.js";
import asyncHandler from "../util/asyncHandler.js";

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: true, // Luôn để true nếu dùng sameSite: "None" (bắt buộc cho cross-site)
    path: "/",
    sameSite: "None",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  };
};

export const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);

  res.cookie("refreshToken", result.refreshToken, getCookieOptions());

  const { refreshToken, ...dataRes } = result;
  return sendSuccess(res, "Login successful", dataRes);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const accessToken = req.headers["authorization"]?.split(" ")[1];
  await authService.logout(refreshToken, accessToken);

  res.clearCookie("refreshToken", getCookieOptions());

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
  const rToken = req.cookies.refreshToken;

  if (!rToken) {
    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.",
    });
  }

  try {
    const newAccessToken = await authService.refreshToken(rToken);
    return sendSuccess(res, "Access token refreshed successfully", {
      accessToken: newAccessToken,
    });
  } catch (error) {
    // Nếu refresh token không hợp lệ hoặc bị thu hồi, xóa cookie luôn
    res.clearCookie("refreshToken", getCookieOptions());
    return res.status(401).json({
      success: false,
      message: error.message || "Phiên đăng nhập không hợp lệ",
    });
  }
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await authService.googleLogin(token);

  res.cookie("refreshToken", result.refreshToken, getCookieOptions());

  const { refreshToken, ...dataRes } = result;
  return sendSuccess(res, "Google login successful", dataRes);
});
