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
import generalRouter from "./src/router/general.js";
import dbMiddleware from "./src/middleware/db.js";
import errorHandler from "./src/middleware/error.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { globalLimiter } from "./src/middleware/rateLimiter.js";
import NotificationRouter from "./src/router/notification.js";


const PORT = process.env.PORT || 5000;
/*
Create Express server
 */
const app = express();
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(globalLimiter);
// Áp dụng dbMiddleware cho tất cả các route API
app.use("/api", dbMiddleware);

/*
Link to router
 */
// app.use("/api/uploads", verifyToken, uploadRouter);

app.use("/api/admin", verifyToken, verifyAdmin, adminRouter);

app.use("/api/customer", verifyToken, verifyCustomer, customerTicketRouter);

app.use("/api/staff", verifyToken, verifyStaff, staffRouter);

app.use("/api/general", generalRouter);
app.use("/api/auth", authRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/notification", NotificationRouter);
app.use("/api/cron", cronRouter);

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
