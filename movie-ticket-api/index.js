import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connect from "./src/config/DB.js";

import session from "express-session";

import adminRouter from "./src/router/admin/index.js";
import customerTicketRouter from "./src/router/customer/ticket.js";
import authRouter from "./src/router/auth.js";
import paymentRouter from "./src/router/payment.js";


import {
  verifyAdmin,
  verifyCustomer,
  verifyToken,
} from "./src/middleware/index.js";
import uploadRouter from "./src/router/uploads/uploads.js";
import generalRouter from "./src/router/general.js";


import dbMiddleware from "./src/middleware/db.js";
import errorHandler from "./src/middleware/error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

export const TOKEN_LIST = [];
export const TOKEN_BLACKLIST = [];

const PORT = process.env.PORT || 5000;
const DEV = process.env.NODE_ENV == 1;

/*
Create Express server
 */
const SESSION_AGE = 1000 * 60 * 60 * 2;
const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  })
);

const store = new session.MemoryStore();
app.use(
  session({
    secret: process.env.SESSION_NAME || "secret",
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { maxAge: SESSION_AGE },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Áp dụng dbMiddleware cho tất cả các route API
app.use("/api", dbMiddleware);

/*
Link to router
 */
app.use("/api/uploads", verifyToken, uploadRouter);

app.use("/api/admin", verifyToken, verifyAdmin, adminRouter);

app.use("/api/customer", verifyToken, verifyCustomer, customerTicketRouter);

app.use("/api/general", generalRouter);
app.use("/api/auth", authRouter);
app.use("/api/payment", paymentRouter);

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
