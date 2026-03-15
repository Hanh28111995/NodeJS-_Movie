import express from "express";
import { register, login, logout, refreshToken, googleLogin } from "../controller/auth.js";
import { validateBody } from "../middleware/validation.js";
import { submitNewUser } from "../validation/index.js";

const authRouter = express.Router();

authRouter.post("/register", validateBody(submitNewUser), register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refreshToken);
authRouter.post("/google-login", googleLogin);

export default authRouter;
