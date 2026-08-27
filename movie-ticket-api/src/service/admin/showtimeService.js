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

    // 2. Lấy thông tin phòng chiếu để lấy danh sách ghế và cinema tương ứng
    const theaterDoc = (await theaterRepository.findById)
      ? await theaterRepository.findById(theaterId)
      : await Theater.findById(theaterId).lean();
    if (!theaterDoc) {
      const error = new Error("Theater not found");
      error.statusCode = 404;
      throw error;
    }

    const resolvedCinemaId = cinemaId || theaterDoc.cinema; // Hoặc lấy trực tiếp từ theaterDoc tùy cấu trúc DB của bạn

    // 3. Lấy thông tin loại ghế (giá, màu sắc) để map vào template ghế
    const seatTypeIds = [
      ...new Set(
        theaterDocs
          .flatMap((t) =>
            (t.seats || []).map((s) => {
              // Xử lý an toàn: nếu s.seatType là object (đã populate), lấy s.seatType._id, ngược lại lấy chính nó
              const id = s.seatType?._id || s.seatType;
              return id?.toString();
            }),
          )
          .filter(Boolean),
      ),
    ];
    const seatTypes = (await seatTypeRepository.findByIds)
      ? await seatTypeRepository.findByIds(seatTypeIds)
      : await SeatType.find({ _id: { $in: seatTypeIds } })
          .select("_id price color")
          .lean();

    const seatTypeMap = Object.fromEntries(
      seatTypes.map((st) => [st._id.toString(), st]),
    );

    // 4. Build danh sách ghế (seats template)
    const seats = (theaterDoc.seats || []).map((s) => {
      const st = seatTypeMap[s.seatType?.toString()];
      return {
        seatNumber: s.seatNumber,
        seatType: s.seatType,
        price: st?.price ?? 0,
        color: st?.color ?? "#cccccc",
        isBooked: false,
      };
    });

    // 5. Tạo suất chiếu mới với đầy đủ các trường yêu cầu
    const showtime = await showtimeRepository.create({
      theater: theaterId,
      id_movie: movieId,
      cinema: resolvedCinemaId,
      startTime,
      seats, // Đã có mảng seats đầy đủ
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
