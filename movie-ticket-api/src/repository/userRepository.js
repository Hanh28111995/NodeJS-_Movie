import User from "../model/userModel.js";

class UserRepository {
  async countDocuments(filters = {}) {
    return await User.countDocuments(filters);
  }

  async findAll(filters = {}, options = {}) {
    const skip = options.skip || 0;
    const limit = options.limit || 8;
    return await User.find(filters)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findById(id) {
    return await User.findById(id).select("-password").lean();
  }

  async findOne(query) {
    return await User.findOne(query);
  }

  async create(data) {
    return await User.create(data);
  }

  async updateById(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, { new: true })
      .select("-password")
      .lean();
  }

  async deleteById(id) {
    return await User.findByIdAndDelete(id);
  }
}

export default new UserRepository();