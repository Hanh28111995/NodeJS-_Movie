import Shop from "../model/shopModel.js";

class ShopRepository {
  async countDocuments(filters = {}) {
    return await Shop.countDocuments(filters);
  }

  async findAll(filters = {}, options = {}) {
    const skip = options.skip || 0;
    const limit = options.limit || 10;
    return await Shop.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findById(id) {
    return await Shop.findById(id).lean();
  }

  async findOne(query) {
    return await Shop.findOne(query).lean();
  }

  async create(data) {
    return await Shop.create(data);
  }

  async updateOne(query, updateData) {
    return await Shop.findOneAndUpdate(query, updateData, { new: true }).lean();
  }

  async deleteOne(query) {
    return await Shop.findOneAndDelete(query);
  }
}

export default new ShopRepository();