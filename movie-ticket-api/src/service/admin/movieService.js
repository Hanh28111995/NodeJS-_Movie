import movieRepository from "../../repository/movieRepository.js";
import ScheduleConfig from "../../model/scheduleConfigModel.js";
import Showtime from "../../model/showtimeModel.js";
import { uploadToFirebase, deleteFromFirebase } from "../../helper/firebaseStorage.js";
import redisClient from "../../config/Redis.js";

class MovieService {
  // Helper xóa cache theo pattern (wildcard)
  async clearMovieCaches() {
    try {
      await redisClient.del("cache:showingMovies").catch(() => {});
      await redisClient.del("cache:comingMovies").catch(() => {});

      const keys = await redisClient.keys("cache:movie:all:*");
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error("Error clearing movie cache:", error);
    }
  }

  async getAllMovies(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, parseInt(query.limit) || 10);
    const skip = (page - 1) * limit;

    // Sử dụng repository thay vì gọi trực tiếp model
    const [movies, total] = await Promise.all([
      movieRepository.findAll({}, { skip, limit }),
      // Lưu ý: Nếu repository chưa có countDocuments, bạn có thể bổ sung vào repo hoặc gọi qua model count nếu cần thiết
      movieRepository.countDocuments ? movieRepository.countDocuments() : 0, 
    ]);

    return {
      movies,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMovieById(movieid) {
    const movie = await movieRepository.findById(movieid);
    if (!movie) {
      const error = new Error("Movie not found");
      error.statusCode = 404;
      throw error;
    }
    return movie;
  }

  async searchMovies(queryParam) {
    const { title } = queryParam;
    const page = Math.max(1, parseInt(queryParam.page) || 1);
    const limit = Math.min(8, parseInt(queryParam.limit) || 8);
    const skip = (page - 1) * limit;

    const queryCondition = title ? { title: { $regex: title, $options: "i" } } : {};
    
    // Gọi qua repository
    const allMatchingMovies = await movieRepository.findByQuery(queryCondition);
    const total = allMatchingMovies.length;

    if (!title && total > 20) {
      const error = new Error(`Có ${total} kết quả. Vui lòng nhập chi tiết hơn để tìm kiếm phim.`);
      error.statusCode = 400;
      throw error;
    }

    // Phân trang thủ công hoặc xử lý phân trang ngay trong repo
    const movies = allMatchingMovies.slice(skip, skip + limit);

    return {
      movies,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async addMovie(bodyData, file) {
    if (!file) {
      const error = new Error("Banner image is required");
      error.statusCode = 400;
      throw error;
    }

    const { publicUrl: bannerUrl } = await uploadToFirebase(file, "movies");
    
    // Gọi repository để tạo mới
    const newMovie = await movieRepository.create({ ...bodyData, banner: bannerUrl });

    await this.clearMovieCaches();
    return newMovie;
  }

  async updateMovie(bodyData, file) {
    const movieid = bodyData.id_movie;
    
    // Gọi repository tìm kiếm theo ID
    const movie = await movieRepository.findById(movieid);
    if (!movie) {
      const error = new Error("Movie not found");
      error.statusCode = 404;
      throw error;
    }

    const updateData = { ...bodyData };

    if (file) {
      const { publicUrl } = await uploadToFirebase(file, "movies");
      updateData.banner = publicUrl;
    }

    // Gọi repository cập nhật
    const updatedMovie = await movieRepository.updateById(movieid, updateData);

    if (file && movie.banner) {
      await deleteFromFirebase(movie.banner);
    }

    await this.clearMovieCaches();
    return updatedMovie;
  }

  async deleteMovie(movieid) {
    // Gọi repository tìm kiếm theo ID
    const movie = await movieRepository.findById(movieid);
    if (!movie) {
      const error = new Error("Movie not found");
      error.statusCode = 404;
      throw error;
    }

    if (movie.banner) {
      try {
        await deleteFromFirebase(movie.banner);
      } catch (firebaseError) {
        console.error("Firebase deletion failed:", firebaseError);
      }
    }

    const isUsedInSchedule = await ScheduleConfig.findOne({
      movie_ids: movie._id,
    });
    if (isUsedInSchedule) {
      await ScheduleConfig.updateMany(
        { movie_ids: movie._id },
        { $pull: { movie_ids: movie._id } }
      );
    }

    await Showtime.deleteMany({ id_movie: movie._id });
    
    // Gọi repository để xóa
    await movieRepository.deleteById(movieid);

    await this.clearMovieCaches();
  }
}

export default new MovieService();