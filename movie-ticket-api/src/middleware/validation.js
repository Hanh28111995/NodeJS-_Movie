import { sendErrorWithDetails } from "../helper/client.js";

export const validateBody = (validationFn) => (req, res, next) => {
  const error = validationFn(req.body);
  if (error) {
    return sendErrorWithDetails(res, "Thông tin thiếu hoặc không hợp lệ", error, 400);
  }
  next();
};
