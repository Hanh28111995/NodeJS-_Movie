import Shift from "../model/shiftModel.js";

class ShiftRepository {
  async findAll() {
    return Shift.find()
      .sort({ startAt: -1 })
      .lean();
  }

  async findByShiftID(shiftID) {
    return Shift.findOne({ shiftID }).lean();
  }

  async create(data) {
    return Shift.create(data);
  }

  async updateByShiftID(shiftID, data) {
    return Shift.findOneAndUpdate({ shiftID }, data, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async deleteByShiftID(shiftID) {
    return Shift.findOneAndDelete({ shiftID }).lean();
  }
}

export default new ShiftRepository();
