import {
  addNewUser,
  deleteUser,
  getAllUser,
  getUserById,
  updateUser,
} from "../../controller/admin/user.js";
import express from "express";
import { validateBody } from "../../middleware/validation.js";
import { submitNewUser } from "../../validation/index.js";

const adminUserRouter = express.Router();

adminUserRouter.get("/all", getAllUser);

adminUserRouter.get("/:userid", getUserById);

adminUserRouter.post("/add", validateBody(submitNewUser), addNewUser);

adminUserRouter.put("/user/:userid", validateBody(submitNewUser), updateUser);

adminUserRouter.delete("/:userid", deleteUser);

export default adminUserRouter;
