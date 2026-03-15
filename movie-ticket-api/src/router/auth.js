import express from "express";
import { register, login, logout, refreshToken } from "../controller/auth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refreshToken);

export default authRouter;
