import Movies from "../model/movieModel.js";
import Showtime from "../model/showtimeModel.js";


class ShowtimeRepository {
  async findAll(skip, limit) {
    const [result, total] = await Promise.all([
      Showtime.find()
        .populate("theater")
        .populate("id_movie")
        .skip(skip)
        .limit(limit)
        .sort({ startTime: 1 })
        .lean(),
      Showtime.countDocuments(),
    ]);
    return { result, total };
  }

  async findById(id) {
    return await Showtime.findById(id)
      .populate("theater")
      .populate("id_movie")
      .lean();
  }

  async findMovieById(movieId) {
    return await Movies.findById(movieId).lean();
  }

  async create(data) {
    return await Showtime.create(data);
  }

  async updateById(id, updateData) {
    return await Showtime.findByIdAndUpdate(id, updateData, { new: true })
      .populate("theater")
      .populate("id_movie")
      .lean();
  }

  async deleteById(id) {
    return await Showtime.findByIdAndDelete(id);
  }

  async findUpcoming() {
    const now = new Date();
    return await Showtime.find({ startTime: { $gt: now } })
      .populate("theater")
      .populate("id_movie")
      .sort({ startTime: 1 })
      .lean();
  }

  async findToday() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return await Showtime.find({
      startTime: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("theater")
      .populate("id_movie")
      .sort({ startTime: 1 })
      .lean();
  }

  async findRange(theaters = [], startTime, endTime) {
    return await Showtime.find({
      theater: { $in: theaters },
      startTime: { $gte: startTime, $lt: endTime },
    })
      .select("_id theater startTime id_movie seats")
      .lean();
  }

  async findForScheduleRollOver(theaters = [], movies = [], slotTimes = []) {
    return await Showtime.find({
      theater: { $in: theaters },
      id_movie: { $in: movies },
      startTime: { $in: slotTimes },
      "seats.isBooked": { $ne: true },
    })
      .select("_id theater startTime")
      .lean();
  }
}

export default new ShowtimeRepository();
