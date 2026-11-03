import shiftRepository from "../../repository/shiftRepository.js";

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateShiftID = (shiftID) => {
  if (typeof shiftID !== "string" || !shiftID.trim()) {
    throw createError("shiftID không hợp lệ", 400);
  }
};

const validateTimes = (startAt, endAt) => {
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(startAt) || !timePattern.test(endAt)) {
    throw createError("startAt và endAt phải có định dạng HH:mm", 400);
  }
  if (startAt === endAt) {
    throw createError("Thời gian bắt đầu và kết thúc không được trùng nhau", 400);
  }
};

const pickShiftFields = (data) => ({
  startAt: data.startAt,
  endAt: data.endAt,
  note: data.note ?? "",
});

class ShiftService {
  async getAllShifts() {
    return shiftRepository.findAll();
  }

  async getShiftByID(shiftID) {
    validateShiftID(shiftID);
    const shift = await shiftRepository.findByShiftID(shiftID);
    if (!shift) throw createError("Không tìm thấy ca làm", 404);
    return shift;
  }

  async createShift(data) {
    validateTimes(data.startAt, data.endAt);
    return shiftRepository.create(pickShiftFields(data));
  }

  async updateShift(shiftID, data) {
    validateShiftID(shiftID);
    const current = await shiftRepository.findByShiftID(shiftID);
    if (!current) throw createError("Không tìm thấy ca làm", 404);

    const update = {
      startAt: data.startAt ?? current.startAt,
      endAt: data.endAt ?? current.endAt,
      note: data.note ?? current.note,
    };
    validateTimes(update.startAt, update.endAt);
    return shiftRepository.updateByShiftID(shiftID, update);
  }

  async deleteShift(shiftID) {
    validateShiftID(shiftID);
    const deleted = await shiftRepository.deleteByShiftID(shiftID);
    if (!deleted) throw createError("Không tìm thấy ca làm", 404);
    return deleted;
  }
}

export default new ShiftService();
