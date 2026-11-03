import StaffShifts from "../model/staffShiftModel.js";

class StaffShiftRepository {
  async findAll(filter = {}) {
    return StaffShifts.find(filter)
      .populate("staffId", "username email userphone")
      .sort({ date: -1, staffId: 1 })
      .lean();
  }

  async findByStaffShiftID(staffShiftID) {
    return StaffShifts.findOne({ staffShiftID })
      .populate("staffId", "username email userphone")
      .lean();
  }

  async findDuplicate({ staffId, date, shiftID, excludeID }) {
    const filter = { staffId, date, shiftID };
    if (excludeID) filter.staffShiftID = { $ne: excludeID };
    return StaffShifts.exists(filter);
  }

  async create(data) {
    return StaffShifts.create(data);
  }

  async updateByStaffShiftID(staffShiftID, data) {
    return StaffShifts.findOneAndUpdate({ staffShiftID }, data, {
      new: true,
      runValidators: true,
    })
      .populate("staffId", "username email userphone")
      .lean();
  }

  async deleteByStaffShiftID(staffShiftID) {
    return StaffShifts.findOneAndDelete({ staffShiftID }).lean();
  }
}

export default new StaffShiftRepository();
