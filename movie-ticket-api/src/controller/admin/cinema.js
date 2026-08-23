import { sendSuccess } from "../../helper/client.js";
import Cinema from "../../model/cinemaModel.js";
import asyncHandler from "../../util/asyncHandler.js";
import redisClient from "../../config/Redis.js"; // 1. Import redisClient

export const getAllCinemas = asyncHandler(async (req, res) => {
  const cinemas = await Cinema.find().lean();
  return sendSuccess(res, "Lấy danh sách rạp phim thành công", { cinemas });
});

export const addCinema = asyncHandler(async (req, res) => {
  const newCinema = await Cinema.create(req.body);

  // 2. Xóa toàn bộ cache liên quan đến rạp và địa điểm
  await redisClient.del("cache:cinemas").catch(console.error);
  await redisClient.del("cache:locations").catch(console.error);
  await redisClient.del("cache:theaterByCinema").catch(console.error);

  return sendSuccess(res, "Thêm rạp phim thành công", newCinema);
});

export const updateCinema = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  const updatedCinema = await Cinema.findByIdAndUpdate(_id, req.body, {
    new: true,
  });

  // 3. Xóa cache liên quan khi cập nhật rạp
  await redisClient.del("cache:cinemas").catch(console.error);
  await redisClient.del("cache:locations").catch(console.error);
  await redisClient.del("cache:theaterByCinema").catch(console.error);

  return sendSuccess(res, "Cập nhật rạp phim thành công", updatedCinema);
});

export const deleteCinema = asyncHandler(async (req, res) => {
  const { cinemaId } = req.params;
  await Cinema.findByIdAndDelete(cinemaId);

  // 4. Xóa cache liên quan khi xóa rạp
  await redisClient.del("cache:cinemas").catch(console.error);
  await redisClient.del("cache:locations").catch(console.error);
  await redisClient.del("cache:theaterByCinema").catch(console.error);

  return sendSuccess(res, "Xóa rạp phim thành công");
});