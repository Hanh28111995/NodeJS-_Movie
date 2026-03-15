import { sendServerError, sendError } from "../helper/client.js";

const errorHandler = (err, req, res, next) => {
  console.error("Error path:", req.path);
  console.error("Error stack:", err.stack);

  if (err.name === "ValidationError") {
    return sendError(res, "Dữ liệu không hợp lệ", err.errors, 400);
  }

  if (err.message === "Unauthorized" || err.name === "JsonWebTokenError") {
    return sendError(res, "Không có quyền truy cập", 401);
  }

  return sendServerError(res, err.message);
};

export default errorHandler;
