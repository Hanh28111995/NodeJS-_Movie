import showtimeRepository from "../../repository/showtimeRepository.js";
import theaterRepository from "../../repository/theaterRepository.js";
import seatTypeRepository from "../../repository/seatTypeRepository.js";
import SeatType from "../../model/seatTypeModel.js";

class ShowtimeService {
  // ... trong Service class
 async createOneShowtime({ theaterId, movieId, startTime, cinemaId }) {
    if (!theaterId || !movieId || !startTime) {
        const error = new Error("Theater, movie and start time are required");
        error.statusCode = 400;
        throw error;
    }

    // 1. Kiểm tra phim có tồn tại không
    const movie = await showtimeRepository.findMovieById(movieId);
    if (!movie) {
        const error = new Error("Movie not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Lấy thông tin phòng chiếu (Dùng theaterId đơn lẻ thay vì theaterDocs)
    const theaterDoc = await theaterRepository.findById(theaterId);
    if (!theaterDoc) {
        const error = new Error("Theater not found");
        error.statusCode = 404;
        throw error;
    }

    const resolvedCinemaId = cinemaId || theaterDoc.cinema;

    // 3. Lấy danh sách ID loại ghế từ phòng chiếu này
    const seatTypeIds = [
      ...new Set(
        (theaterDoc.seats || []).map((s) => {
          const id = s.seatType?._id || s.seatType;
          return id?.toString();
        }).filter(Boolean)
      ),
    ];

    // 4. Lấy thông tin giá, màu sắc của loại ghế qua Repository
    const seatTypes = await seatTypeRepository.findByIds(seatTypeIds);
    const seatTypeMap = Object.fromEntries(seatTypes.map((st) => [st._id.toString(), st]));

    // 5. Tạo template ghế có đầy đủ giá và màu
    const seats = (theaterDoc.seats || []).map((s) => {
        const seatTypeIdStr = (s.seatType?._id || s.seatType)?.toString();
        const st = seatTypeMap[seatTypeIdStr];
        return {
            seatNumber: s.seatNumber,
            seatType: seatTypeIdStr,
            price: st?.price ?? 0,
            color: st?.color ?? "#cccccc",
            isBooked: false,
        };
    });

    // 6. Lưu suất chiếu xuống database
    const showtime = await showtimeRepository.create({
        theater: theaterId,
        id_movie: movieId,
        cinema: resolvedCinemaId,
        startTime,
        seats,
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
