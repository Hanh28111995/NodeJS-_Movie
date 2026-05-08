import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Imports routers và middlewares
import adminRouter from "./src/router/admin/index.js";
import customerTicketRouter from "./src/router/customer/index.js";
import authRouter from "./src/router/auth.js";
import paymentRouter from "./src/router/payment.js";
import cronRouter from "./src/router/cron.js";
import staffRouter from "./src/router/staff/index.js";
import uploadRouter from "./src/router/uploads/uploads.js";
import generalRouter from "./src/router/general.js";

import { verifyAdmin, verifyCustomer, verifyToken, verifyStaff } from "./src/middleware/index.js";
import dbMiddleware from "./src/middleware/db.js";
import errorHandler from "./src/middleware/error.js";

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1. CẤU HÌNH CORS (PHẢI LÀ ĐẦU TIÊN) ---
const allowedOrigins = [
  "https://moviebooking-ht.vercel.app", 
  "http://localhost:5173", 
  "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép các request không có origin (như Postman) hoặc nằm trong danh sách
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS: Origin không hợp lệ"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-vercel-cron"]
}));

// Xử lý Preflight (OPTIONS) ngay lập tức để tránh 403 Forbidden
app.options("*", cors());

// --- 2. CÁC MIDDLEWARE CƠ BẢN ---
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 3. KẾT NỐI DATABASE (SINGLETON QUA MIDDLEWARE) ---
// Phải đặt trước các router để chắc chắn có DB trước khi query
app.use("/api", dbMiddleware);

// --- 4. ĐỊNH TUYẾN (ROUTERS) ---

// Public Routes (Không cần Token) - Để lên trước để tránh check Token nhầm
app.use("/api/general", generalRouter);
app.use("/api/auth", authRouter);
app.use("/api/cron", cronRouter);

// Protected Routes (Cần Token)
app.use("/api/uploads", verifyToken, uploadRouter);
app.use("/api/admin", verifyToken, verifyAdmin, adminRouter);
app.use("/api/customer", verifyToken, verifyCustomer, customerTicketRouter);
app.use("/api/staff", verifyToken, verifyStaff, staffRouter);
app.use("/api/payment", verifyToken, paymentRouter); // Thường payment cũng cần token

// --- 5. XỬ LÝ LỖI TẬP TRUNG ---
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;