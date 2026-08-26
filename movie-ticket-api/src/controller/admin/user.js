import {
  sendSuccess,
  sendError,
} from "../../helper/client.js";
import asyncHandler from "../../util/asyncHandler.js";
import userService from "../../service/admin/userService.js";

export const getAllUser = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers(req.query);
  return sendSuccess(res, "Users retrieved successfully", result);
});

export const searchUser = getAllUser;

export const getUserById = asyncHandler(async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.userid);
    return sendSuccess(res, "User found", user);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});

export const addNewUser = asyncHandler(async (req, res) => {
  try {
    const newUser = await userService.addNewUser(req.body);
    return sendSuccess(res, "User created successfully", newUser);
  } catch (error) {
    if (error.statusCode === 400 || error.statusCode === 409) {
      return sendError(res, error.message, error.statusCode);
    }
    throw error;
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  try {
    const updated = await userService.updateUser( req.body);
    return sendSuccess(res, "User updated successfully", updated);
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  try {
    await userService.deleteUser(req.params.userid);
    return sendSuccess(res, "User deleted successfully");
  } catch (error) {
    if (error.statusCode === 404) {
      return sendError(res, error.message, 404);
    }
    throw error;
  }
});