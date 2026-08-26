import seatTypeRepository from "../../repository/seatTypeRepository.js";
import redisClient from "../../config/Redis.js";

class SeatTypeService {
  async getAllSeatTypes() {
    const cacheKey = "cache:seatTypes";

    const cachedSeatTypes = await redisClient.get(cacheKey).catch(() => null);
    if (cachedSeatTypes) {
      return { seatTypes: JSON.parse(cachedSeatTypes) };
    }

    const seatTypes = await seatTypeRepository.findAll();
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(seatTypes)).catch(() => {});

    return { seatTypes };
  }

  async addSeatType(bodyData) {
    const newSeatType = await seatTypeRepository.create(bodyData);
    
    // Xóa cache ngay lập tức khi thêm mới
    await redisClient.del("cache:seatTypes").catch(console.error);

    return newSeatType;
  }

  async updateSeatType(bodyData) {
    const { _id, ...updateData } = bodyData;
    if (!_id) {
      const error = new Error("Thiếu _id");
      error.statusCode = 400;
      throw error;
    }

    const updatedSeatType = await seatTypeRepository.updateById(_id, updateData);
    if (!updatedSeatType) {
      const error = new Error("SeatType not found");
      error.statusCode = 404;
      throw error;
    }

    // Xóa cache ngay lập tức khi cập nhật
    await redisClient.del("cache:seatTypes").catch(console.error);

    return updatedSeatType;
  }

  async deleteSeatType(id) {
    const seatType = await seatTypeRepository.findById(id);
    if (!seatType) {
      const error = new Error("SeatType not found");
      error.statusCode = 404;
      throw error;
    }

    await seatTypeRepository.deleteById(id);

    // Xóa cache ngay lập tức khi xóa
    await redisClient.del("cache:seatTypes").catch(console.error);

    return true;
  }
}

export default new SeatTypeService();