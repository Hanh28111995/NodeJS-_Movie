import ScheduleConfig from "../model/scheduleConfigModel.js";
import Showtime from "../model/showtimeModel.js";
import Movies from "../model/movieModel.js";
import SeatType from "../model/seatTypeModel.js";
import theaterRepository from "../repository/theaterRepository.js";
import cinemaRepository from "../repository/cinemaRepository.js";
import mongoose from "mongoose";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Asia/Ho_Chi_Minh";

// Helper: đầu ngày theo giờ VN
const dayStart = (d) => dayjs(d).tz(TZ).startOf("day");
// Helper: chuyển "HH:mm" -> dayjs trong ngày cho sẵn
const slotToTime = (base, slot) => {
  const [h, m] = slot.split(":").map(Number);
  return base.hour(h).minute(m || 0).second(0).millisecond(0);
};

class ScheduleService {
  // ---------- Quản lý config ----------
  async getConfig() {
    return await ScheduleConfig.findOne().lean();
  }

  async createConfig(data) {
    const existing = await ScheduleConfig.findOne();
    if (existing) {
      const error = new Error("Configuration already exists, use update");
      error.statusCode = 400;
      throw error;
    }
    return await ScheduleConfig.create(data);
  }

  async updateConfig(data) {
    const config = await ScheduleConfig.findOneAndUpdate({}, data, {
      new: true,
    });
    if (!config) {
      const error = new Error("Configuration not found, use create first");
      error.statusCode = 404;
      throw error;
    }
    return config;
  }

  // ---------- Sinh suất chiếu ----------
  async generateSchedule() {
    const config = await ScheduleConfig.findOne({ isActive: true }).lean();
    if (!config) {
      return { created: 0, skipped: 0, message: "No active configuration found" };
    }

    const movies = (config.movies || []).filter((m) => m?.movie_id);
    const theaters = (config.theaters || []).filter(
      mongoose.Types.ObjectId.isValid,
    );
    const timeSlots = (config.timeSlots || []).filter(Boolean);
    const generateDays = Math.min(14, Math.max(1, config.generateDays ?? 3));

    if (movies.length === 0 || theaters.length === 0 || timeSlots.length === 0) {
      return { created: 0, skipped: 0, message: "Invalid configuration" };
    }

    // ---- Load dữ liệu (dùng đúng method repo/model đang tồn tại) ----
    const theaterDocs = await theaterRepository.findByIds(theaters);
    const allCinemas = await cinemaRepository.findAll();
    const cinemaMap = Object.fromEntries(
      allCinemas.map((c) => [c.branch, c._id]),
    );

    const seatTypeMap = {};
    const seatTypeIds = [
      ...new Set(
        theaterDocs.flatMap(
          (t) =>
            t.seats?.map((s) => s.seatType?.toString()).filter(Boolean) || [],
        ),
      ),
    ];
    if (seatTypeIds.length) {
      const sts = await SeatType.find({ _id: { $in: seatTypeIds } }).lean();
      sts.forEach((st) => (seatTypeMap[st._id.toString()] = st));
    }

    const movieIds = movies.map((m) => m.movie_id.toString());
    const movieDocs = await Movies.find({ _id: { $in: movieIds } }).lean();
    const validMovieIds = movieDocs.map((m) => m._id.toString());
    if (validMovieIds.length === 0) {
      return { created: 0, skipped: 0, message: "No movies exist" };
    }

    let created = 0;
    let skipped = 0;
    const today = dayStart(new Date());

    for (let i = 0; i < generateDays; i++) {
      const day = today.add(i, "day");
      const dayStartNative = day.toDate();

      // Phim còn trong cửa sổ chiếu của ngày này
      const activeMovies = movies
        .filter((m) => {
          const s = m.startDate ? dayStart(new Date(m.startDate)) : null;
          const e = m.endDate ? dayStart(new Date(m.endDate)) : null;
          if (s && day.isBefore(s, "day")) return false;
          if (e && day.isAfter(e, "day")) return false;
          return true;
        })
        .filter((m) => validMovieIds.includes(m.movie_id.toString()));

      if (activeMovies.length === 0) continue;

      for (const theaterId of theaters) {
        const theaterDoc = theaterDocs.find(
          (t) => t._id.toString() === theaterId,
        );
        if (
          !theaterDoc ||
          !Array.isArray(theaterDoc.seats) ||
          theaterDoc.seats.length === 0
        ) {
          skipped++;
          continue;
        }

        const cinemaId = cinemaMap[theaterDoc.cinemaName];
        if (!cinemaId) {
          skipped++;
          continue;
        }

        // 1) Suất đã tồn tại trong ngày này ở theater này → không đụng.
        const existing = await Showtime.find({
          theater: theaterId,
          startTime: {
            $gte: dayStartNative,
            $lt: day.add(1, "day").toDate(),
          },
        })
          .select("_id")
          .lean();

        if (existing.length > 0) {
          skipped += timeSlots.length;
          continue;
        }

        // 2) Tạo seats template với price/color từ seatType
        const seatsTemplate = theaterDoc.seats.map((s) => {
          const st = seatTypeMap[s.seatType?.toString()];
          return {
            seatNumber: s.seatNumber,
            seatType: s.seatType,
            price: st?.price ?? 0,
            color: st?.color ?? "#cccccc",
            isBooked: false,
          };
        });

        // 3) Round-robin phim theo theater
        const movieWindowList = activeMovies;
        const dayOffset = theaterDocs.findIndex(
          (t) => t._id.toString() === theaterId,
        );

        const toInsert = timeSlots.map((slot, idx) => {
          const movieWindow =
            movieWindowList[(idx + dayOffset) % movieWindowList.length];
          return {
            id_movie: movieWindow.movie_id,
            cinema: cinemaId,
            theater: theaterId,
            startTime: slotToTime(day, slot).toDate(),
            seats: seatsTemplate,
          };
        });

        // ⭐ Index unique theater+startTime bảo vệ: chạy song song không nhân bản
        try {
          const inserted = await Showtime.insertMany(toInsert, {
            ordered: false,
          });
          created += inserted.length;
        } catch (err) {
          if (err?.code === 11000) {
            skipped += toInsert.length; // trùng → đã có, bỏ qua
          } else {
            throw err;
          }
        }
      }
    }

    // Dọn suất QUÁ KHỨ chưa có vé (không bao giờ đụng suất tương lai / có vé)
    const pastLimit = today.subtract(1, "day").toDate();
    await Showtime.deleteMany({
      startTime: { $lt: pastLimit },
      "seats.isBooked": { $ne: true },
    });

    return {
      created,
      skipped,
      message: `Generated ${created} showtimes (${skipped} skipped existing slots)`,
    };
  }

  // ---------- Hỗ trợ admin: xóa suất TRỐNG để tái sinh ----------
  async deleteEmptyShowtimes() {
    const res = await Showtime.deleteMany({
      "seats.isBooked": { $ne: true },
    });
    return { deleted: res.deletedCount };
  }
}

export default new ScheduleService();