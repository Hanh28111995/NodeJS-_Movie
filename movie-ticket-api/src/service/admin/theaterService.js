import theaterRepository from "../../repository/theaterRepository.js";
import { generateSeats } from "../../helper/generateSeats.js";
import redisClient from "../../config/Redis.js";

class TheaterService {
  // Helper xóa cache liên quan đến phòng chiếu và rạp
  async #clearTheaterCaches() {
    try {
      await redisClient.del("cache:theaterByCinema").catch(() => {});
      await redisClient.del("cache:cinemas").catch(() => {});
      await redisClient.del("cache:locations").catch(() => {});
    } catch (error) {
      console.error("Error clearing theater cache:", error);
    }
  }

  async getAllTheaters() {
    const theaters = await theaterRepository.findAll();
    return { theaters };
  }

  async getTheaterById(id) {
    const theater = await theaterRepository.findById(id);
    if (!theater) {
      const error = new Error("Không tìm thấy phòng chiếu");
      error.statusCode = 404;
      throw error;
    }
    return { theater };
  }

  async addTheater(bodyData) {
    const { totalSeat } = bodyData;
    
    // Tự động tạo danh sách ghế nếu có thông số rows và cols
    if (totalSeat && totalSeat.rows && totalSeat.cols) {
      bodyData.seats = await generateSeats(totalSeat.rows, totalSeat.cols);
    }

    const newTheater = await theaterRepository.create(bodyData);

    // Xóa cache khi thêm phòng chiếu mới
    await this.#clearTheaterCaches();

    return newTheater;
  }

  async updateTheater(id, updateData) {
    const { totalSeat, seats } = updateData;

    // Lấy thông tin phòng chiếu cũ trong DB để so sánh quy mô (rows/cols)
    const oldTheater = await theaterRepository.findById(id);
    if (!oldTheater) {
        const error = new Error("Không tìm thấy phòng chiếu để cập nhật");
        error.statusCode = 404;
        throw error;
    }

    const isRowsColsChanged = 
        totalSeat && 
        (totalSeat.rows !== oldTheater.totalSeat?.rows || totalSeat.cols !== oldTheater.totalSeat?.cols);

    if (isRowsColsChanged || (Array.isArray(seats) && seats.length === 0 && totalSeat?.rows && totalSeat?.cols)) {
        // Trường hợp 1: Đổi rows/cols hoặc client gửi seats = [] do bấm reset quy mô
        // -> Tiến hành sinh lại sơ đồ ghế mới hoàn toàn
        updateData.seats = await generateSeats(totalSeat.rows, totalSeat.cols);
    } 
    else if (!Array.isArray(seats) || seats.length === 0) {
        // Trường hợp 2: Quy mô không đổi mà seats rỗng/không gửi 
        // -> Giữ nguyên giá trị cũ, xóa trường seats ra khỏi lệnh update để không bị ghi đè mất dữ liệu
        delete updateData.seats;
    } 
    else {
        // Trường hợp 3: Client có gửi danh sách ghế cụ thể (ví dụ admin chỉnh sửa từng ghế thủ công trên giao diện)
        // -> Cập nhật bình thường theo mảng seats mới
        updateData.seats = seats;
    }

    const updatedTheater = await theaterRepository.updateById(id, updateData);
    await this.#clearTheaterCaches();

    return updatedTheater;
}

  async deleteTheater(id) {
    const theater = await theaterRepository.findByIdRaw(id);
    if (!theater) {
      const error = new Error("Không tìm thấy phòng chiếu để xóa");
      error.statusCode = 404;
      throw error;
    }

    await theaterRepository.deleteById(id);

    // Xóa cache khi xóa phòng chiếu
    await this.#clearTheaterCaches();

    return true;
  }
}

export default new TheaterService();