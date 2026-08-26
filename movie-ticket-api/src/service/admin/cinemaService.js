import cinemaRepository from "../../repository/cinemaRepository.js";
import redisClient from "../../config/Redis.js";

class CinemaService {
  async getAllCinemas() {
    const cinemas = await cinemaRepository.findAll();
    return { cinemas };
  }

  async addCinema(bodyData) {
    const newCinema = await cinemaRepository.create(bodyData);

    // Xóa toàn bộ cache liên quan đến rạp và địa điểm
    await Promise.all([
      redisClient.del("cache:cinemas").catch(console.error),
      redisClient.del("cache:locations").catch(console.error),
      redisClient.del("cache:theaterByCinema").catch(console.error),
    ]);

    return newCinema;
  }

  async updateCinema(bodyData) {
    const { _id, ...updateFields } = bodyData;
    if (!_id) {
      const error = new Error("_id is required for update");
      error.statusCode = 400;
      throw error;
    }

    const existing = await cinemaRepository.findById(_id);
    if (!existing) {
      const error = new Error("Cinema not found");
      error.statusCode = 404;
      throw error;
    }

    const updatedCinema = await cinemaRepository.updateById(_id, updateFields);

    // Xóa cache liên quan khi cập nhật rạp
    await Promise.all([
      redisClient.del("cache:cinemas").catch(console.error),
      redisClient.del("cache:locations").catch(console.error),
      redisClient.del("cache:theaterByCinema").catch(console.error),
    ]);

    return updatedCinema;
  }

  async deleteCinema(cinemaId) {
    const existing = await cinemaRepository.findById(cinemaId);
    if (!existing) {
      const error = new Error("Cinema not found");
      error.statusCode = 404;
      throw error;
    }

    await cinemaRepository.deleteById(cinemaId);

    // Xóa cache liên quan khi xóa rạp
    await Promise.all([
      redisClient.del("cache:cinemas").catch(console.error),
      redisClient.del("cache:locations").catch(console.error),
      redisClient.del("cache:theaterByCinema").catch(console.error),
    ]);
  }
}

export default new CinemaService();