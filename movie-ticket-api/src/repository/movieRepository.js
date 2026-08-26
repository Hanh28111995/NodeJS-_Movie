import Movies from "../model/movieModel.js";

class MovieRepository {  

    async countDocuments(filters = {}) {
    return await Movies.countDocuments(filters);
  }

  async findAll(filters = {}, options = {}) {
    const skip = options.skip || 0;
    const limit = options.limit || 10;    
    return await Movies.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findById(id) {
    return await Movies.findById(id);
  }

  async findByQuery(queryCondition = {}) {
    // Tìm kiếm linh hoạt theo query object, sắp xếp sớm nhất đứng trước
    return await Movies.find(queryCondition).sort({ createdAt: 1 });
  }

  async create(data) {
    return await Movies.create(data);
  }

  async updateById(id, updateData) {
    return await Movies.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteById(id) {
    return await Movies.findByIdAndDelete(id);
  }
}

export default new MovieRepository();
