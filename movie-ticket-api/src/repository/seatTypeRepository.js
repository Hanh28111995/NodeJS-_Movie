import SeatType from "../model/seatTypeModel.js";

class SeatTypeRepository {
  async findAll() {
    return await SeatType.find().lean();
  }

  async findById(id) {
    return await SeatType.findById(id).lean();
  }

  async create(data) {
    return await SeatType.create(data);
  }

  async updateById(id, updateData) {
    return await SeatType.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();
  }

  async deleteById(id) {
    return await SeatType.findByIdAndDelete(id);
  }

  async findByIds(ids) {
    return await SeatType.find({ _id: { $in: ids } }).lean();
  }
}

export default new SeatTypeRepository();
