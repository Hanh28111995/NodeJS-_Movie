import Promotion from "../model/promotionModel.js";


class PromotionRepository {
  async countDocuments(filters = {}) {
    return await Promotion.countDocuments(filters);
  }

  async findAll(filters = {}, options = {}) {
    const skip = options.skip || 0;
    const limit = options.limit || 10;
    return await Promotion.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findById(id) {
    return await Promotion.findById(id).lean();
  }

  async findOne(query) {
    return await Promotion.findOne(query).lean();
  }

  async create(data) {
    return await Promotion.create(data);
  }

  async updateById(id, updateData) {
    return await Promotion.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async deleteById(id) {
    return await Promotion.findByIdAndDelete(id);
  }
}

export default new PromotionRepository();