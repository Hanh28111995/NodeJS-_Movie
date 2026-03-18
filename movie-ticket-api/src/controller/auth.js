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
  const token = req.cookies.refreshToken || (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  const newAccessToken = await authService.refreshToken(token);

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
