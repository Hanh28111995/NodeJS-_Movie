import Theater from "../model/theaterModel.js";

class TheaterRepository {
  async findAll() {
    return await Theater.find().populate("cinemaName").lean();
  }

  async findById(id) {
    return await Theater.findById(id).populate("seats.seatType").lean();
  }

  async findByIdRaw(id) {
    return await Theater.findById(id);
  }

  async create(data) {
    return await Theater.create(data);
  }

  async updateById(id, updateData) {
    return await Theater.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async deleteById(id) {
    return await Theater.findByIdAndDelete(id);
  }
}

export default new TheaterRepository();