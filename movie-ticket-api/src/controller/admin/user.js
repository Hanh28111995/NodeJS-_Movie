import { sendServerError, sendSuccess, sendError } from "../../helper/client.js";
import * as userService from "../../service/userService.js";
import { submitNewUser } from "../../validation/index.js";
import asyncHandler from "../../util/asyncHandler.js";

export const getAllUser = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const result = await userService.getAllUsers({ page: Number(page), limit: Number(limit), search });
  return sendSuccess(res, "All users retrieved successfully", result);
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.userid);
  if (!user) return sendError(res, "User not found", 404);
  return sendSuccess(res, "User found", user);
});

export const addNewUser = asyncHandler(async (req, res) => {
  const validate = submitNewUser(req.body);
  if (validate) return sendError(res, "Invalid input data", 400);
  try {
    const newUser = await userService.createUser(req.body);
    return sendSuccess(res, "User created successfully", { id: newUser._id, username: newUser.username, email: newUser.email });
  } catch (err) {
    return sendError(res, err.message, 409);
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const updated = await userService.updateUser(req.params.userid, req.body);
  if (!updated) return sendError(res, "User not found", 404);
  return sendSuccess(res, "User updated successfully", updated);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await userService.deleteUser(req.params.userid);
  if (!deleted) return sendError(res, "User not found", 404);
  return sendSuccess(res, "User deleted successfully");
});
