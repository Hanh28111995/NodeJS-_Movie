import mongoose from "mongoose";
import Shift from "../../model/shiftModel.js";
import User from "../../model/userModel.js";
import staffShiftRepository from "../../repository/staffShiftRepository.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateStaffShiftID = (staffShiftID) => {
  if (typeof staffShiftID !== "string" || !staffShiftID.trim()) {
    throw createError("staffShiftID không hợp lệ", 400);
  }
};

const normalizeDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw createError("date phải có định dạng YYYY-MM-DD", 400);
  }
  const normalized = new Date(`${date}T00:00:00.000Z`);
  if (
    Number.isNaN(normalized.getTime()) ||
    normalized.toISOString().slice(0, 10) !== date
  ) {
    throw createError("date không hợp lệ", 400);
  }
  return normalized;
};

const validateStaff = async (staffId) => {
  if (!mongoose.isValidObjectId(staffId)) {
    throw createError("staffId không hợp lệ", 400);
  }
  const staff = await User.exists({ _id: staffId, role: "staff" });
  if (!staff) throw createError("Không tìm thấy tài khoản staff", 404);
};

const validateShift = async (shiftID) => {
  if (typeof shiftID !== "string" || !shiftID.trim()) {
    throw createError("shiftID không hợp lệ", 400);
  }
  const shift = await Shift.exists({ shiftID });
  if (!shift) throw createError("Không tìm thấy ca làm", 404);
};

const rethrowDuplicate = (error) => {
  if (error.code === 11000) {
    throw createError("Nhân viên đã được phân ca này vào ngày đã chọn", 409);
  }
  throw error;
};

class StaffShiftService {
  async getAllStaffShifts(query = {}) {
    const filter = {};
    if (query.staffId) {
      if (!mongoose.isValidObjectId(query.staffId)) {
        throw createError("staffId không hợp lệ", 400);
      }
      filter.staffId = query.staffId;
    }
    if (query.shiftID) {
      filter.shiftID = query.shiftID;
    }
    if (query.date) {
      const date = normalizeDate(query.date);
      filter.date = date;
    }
    return staffShiftRepository.findAll(filter);
  }

  async getStaffShiftByID(staffShiftID) {
    validateStaffShiftID(staffShiftID);
    const assignment =
      await staffShiftRepository.findByStaffShiftID(staffShiftID);
    if (!assignment) throw createError("Không tìm thấy phân ca", 404);
    return assignment;
  }

  async createStaffShift(data) {
    const staffId = data.staffId;
    const date = normalizeDate(data.date);
    const shiftID = data.shiftID;
    await Promise.all([validateStaff(staffId), validateShift(shiftID)]);

    try {
      return await staffShiftRepository.create({
        staffId,
        date,
        shiftID: shiftID.trim(),
      });
    } catch (error) {
      rethrowDuplicate(error);
    }
  }

  async updateStaffShift(staffShiftID, data) {
    validateStaffShiftID(staffShiftID);
    const current =
      await staffShiftRepository.findByStaffShiftID(staffShiftID);
    if (!current) throw createError("Không tìm thấy phân ca", 404);

    const staffId = data.staffId ?? current.staffId._id;
    const date = data.date === undefined
      ? current.date
      : normalizeDate(data.date);
    const shiftID = data.shiftID ?? current.shiftID;
    await Promise.all([validateStaff(staffId), validateShift(shiftID)]);

    try {
      return await staffShiftRepository.updateByStaffShiftID(staffShiftID, {
        staffId,
        date,
        shiftID: shiftID.trim(),
      });
    } catch (error) {
      rethrowDuplicate(error);
    }
  }

  async deleteStaffShift(staffShiftID) {
    validateStaffShiftID(staffShiftID);
    const deleted =
      await staffShiftRepository.deleteByStaffShiftID(staffShiftID);
    if (!deleted) throw createError("Không tìm thấy phân ca", 404);
    return deleted;
  }
}

export default new StaffShiftService();
