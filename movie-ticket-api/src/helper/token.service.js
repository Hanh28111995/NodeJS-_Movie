import redisClient from "../config/Redis";


// Thêm token vào blacklist với thời gian hết hạn (tính bằng giây)
export const blacklistToken = async (token, expiresInSeconds) => {
  // Lưu với key dạng "bl:<token>" và giá trị "revoked"
  await redisClient.set(`bl:${token}`, "revoked", {
    EX: expiresInSeconds, // Tự động xóa khỏi Redis khi token hết hạn để tiết kiệm bộ nhớ
  });
};

// Kiểm tra token có bị blacklist chưa
export const isTokenBlacklisted = async (token) => {
  const result = await redisClient.get(`bl:${token}`);
  return result !== null; // Trả về true nếu token tồn tại trong blacklist
};