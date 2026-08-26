import showtimeRepository from "../../repository/showtimeRepository.js";

class ShowtimeService {
  async createOneShowtime({ theaterId, movieId, startTime }) {
    if (!theaterId || !movieId || !startTime) {
      const error = new Error("Theater, movie and start time are required");
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra xem phim có tồn tại không
    const movie = await showtimeRepository.findMovieById(movieId);
    if (!movie) {
      const error = new Error("Movie not found");
      error.statusCode = 404;
      throw error;
    }

    const showtime = await showtimeRepository.create({
      theater: theaterId,
      id_movie: movieId,
      startTime,
    });

    return showtime;
  }

  async fetchAllShowtimes(page, limit) {
    const skip = (page - 1) * limit;
    return await showtimeRepository.findAll(skip, limit);
  }

  async fetchShowtimeById(id) {
    const showtime = await showtimeRepository.findById(id);
    if (!showtime) {
      const error = new Error("Showtime not found");
      error.statusCode = 404;
      throw error;
    }
    return showtime;
  }

  async updateShowtimeById(id, updateData) {
    if (!id) {
      const error = new Error("Showtime ID is required");
      error.statusCode = 400;
      throw error;
    }

    const updated = await showtimeRepository.updateById(id, updateData);
    if (!updated) {
      const error = new Error("Showtime not found to update");
      error.statusCode = 404;
      throw error;
    }

    return updated;
  }

  async removeShowtimeById(id) {
    const showtime = await showtimeRepository.findById(id);
    if (!showtime) {
      const error = new Error("Showtime not found to delete");
      error.statusCode = 404;
      throw error;
    }

    await showtimeRepository.deleteById(id);
    return true;
  }

  async fetchUpcomingShowtimes() {
    return await showtimeRepository.findUpcoming();
  }

  async fetchTodayShowtimes() {
    return await showtimeRepository.findToday();
  }
}

export default new ShowtimeService();