import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connect from "./src/config/DB.js";

import adminRouter from "./src/router/admin/index.js";
import customerTicketRouter from "./src/router/customer/index.js"; // Sửa lại import đúng file index
import authRouter from "./src/router/auth.js";
import paymentRouter from "./src/router/payment.js";
import cronRouter from "./src/router/cron.js";
import staffRouter from "./src/router/staff/index.js";


import {
  verifyAdmin,
  verifyCustomer,
  verifyToken,
  verifyStaff 
} from "./src/middleware/index.js";
import uploadRouter from "./src/router/uploads/uploads.js";
import generalRouter from "./src/router/general.js";


import dbMiddleware from "./src/middleware/db.js";
import errorHandler from "./src/middleware/error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

export const TOKEN_LIST = [];
export const TOKEN_BLACKLIST = new Set();

const PORT = process.env.PORT || 5000;
const DEV = process.env.NODE_ENV == 1;

/*
Create Express server
 */
const SESSION_AGE = 1000 * 60 * 60 * 2;
const app = express();

app.set("trust proxy", 1); // Cần thiết để cookie secure: true hoạt động qua proxy (Vercel)

app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép tất cả các request không có origin hoặc từ localhost hoặc từ bất kỳ domain vercel nào
      if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true); // Tạm thời cho phép tất cả để vượt qua Firewall
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 204
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Áp dụng dbMiddleware cho tất cả các route API
app.use("/api", dbMiddleware);

/*
Link to router - Public Routes first
 */
app.use("/api/general", generalRouter);
app.use("/api/auth", authRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/cron", cronRouter);

/*
Link to router - Protected Routes
 */
app.use("/api/uploads", verifyToken, uploadRouter);
app.use("/api/admin", verifyToken, verifyAdmin, adminRouter);
app.use("/api/customer", verifyToken, verifyCustomer, customerTicketRouter);
app.use("/api/staff", verifyToken, verifyStaff, staffRouter);

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
