import { sendError } from "../helper/client.js";

export const validateBody = (validationFn) => (req, res, next) => {
  const error = validationFn(req.body);
  if (error) {
    return sendError(res, "Thông tin thiếu hoặc không hợp lệ", error, 400);
  }
  next();
};
