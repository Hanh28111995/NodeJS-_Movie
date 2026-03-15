import {
  addNewUser,
  deleteUser,
  getAllUser,
  getUserById,
  updateUser,
} from "../../controller/admin/user.js";


import express from "express";

const adminUserRouter = express.Router();

/**
 * @route GET /api/admin/user/all
 * @description Add a new user
 * @access private (admin only)
 */
adminUserRouter.get("/all", getAllUser);

/**
 * @route GET /api/admin/user/:userid
 * @description Get a user
 * @access private (admin only)
 */
adminUserRouter.get("/:userid", getUserById);

/**
 * @route POST /api/admin/user/add
 * @description Add a new user
 * @access private (admin only)
 */
adminUserRouter.post("/add", addNewUser);

/**
 * @route PUT /api/admin/user/update/:id
 * @description edit user by id
 * @access private (admin only)
 */
adminUserRouter.put("/user/:userid", updateUser);

/**
 * @route DELETE /api/admin/user/delete/:id
 * @description delete user by id
 * @access private (admin only)
 */
adminUserRouter.delete("/:userid", deleteUser);

export default adminUserRouter;
