import Cinema from "../model/cinemaModel.js";


class CinemaRepository {
  async findAll() {
    return await Cinema.find().lean();
  }

  async findById(id) {
    return await Cinema.findById(id).lean();
  }

  async create(data) {
    return await Cinema.create(data);
  }

  async updateById(id, updateData) {
    return await Cinema.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async deleteById(id) {
    return await Cinema.findByIdAndDelete(id);
  }
}

export default new CinemaRepository();