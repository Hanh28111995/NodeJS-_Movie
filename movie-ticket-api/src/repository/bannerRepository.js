import Banner from "../model/bannerModel.js";

class BannerRepository {
  async findAll() {
    return await Banner.find().sort({ createdAt: -1 }).lean();
  }

  async findById(id) {
    return await Banner.findById(id).lean();
  }

  async create(data) {
    return await Banner.create(data);
  }

  async updateById(id, updateData) {
    return await Banner.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  async deleteById(id) {
    return await Banner.findByIdAndDelete(id);
  }
}

export default new BannerRepository();
