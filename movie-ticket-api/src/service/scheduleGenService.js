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
  const parts = String(slot).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);

  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    throw new Error(`Invalid time slot format: "${slot}"`);
  }

  return base.hour(h).minute(m).second(0).millisecond(0);
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
    const config = await ScheduleConfig.findOneAndUpdate(
      {},
      { $set: data },
      {
        new: true,
        runValidators: true,
      },
    );
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
      console.log("[scheduleGen] Stop: No active configuration found");
      return {
        created: 0,
        skipped: 0,
        message: "No active configuration found",
      };
    }

    const movies = (config.movies || []).filter((m) => m?.movie_id);
    const theaters = (config.theaters || [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => id.toString());
    const timeSlots = (config.timeSlots || []).filter(Boolean);
    const generateDays = Math.min(14, Math.max(1, config.generateDays ?? 3));

    console.log("[scheduleGen] Config loaded:", {
      id: config._id,
      movies: movies.length,
      theaters: theaters.length,
      timeSlots,
      generateDays,
    });

    if (
      movies.length === 0 ||
      theaters.length === 0 ||
      timeSlots.length === 0
    ) {
      console.log("[scheduleGen] Stop: Invalid configuration");
      return { created: 0, skipped: 0, message: "Invalid configuration" };
    }

    // ---- Load dữ liệu ----
    const theaterDocs = await theaterRepository.findByIds(theaters);
    const allCinemas = await cinemaRepository.findAll();
    const cinemaMap = new Map(
      allCinemas
        .filter((c) => c.branch)
        .map((c) => [c.branch.trim().toLowerCase(), c._id]),
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
      sts.forEach((st) => {
        seatTypeMap[st._id.toString()] = st;
      });
    }

    const movieIds = movies.map((m) => m.movie_id.toString());
    const movieDocs = await Movies.find({ _id: { $in: movieIds } }).lean();
    const validMovieIds = new Set(movieDocs.map((m) => m._id.toString()));

    console.log("[scheduleGen] Master data:", {
      theaterDocs: theaterDocs.length,
      cinemas: allCinemas.length,
      cinemaBranches: [...cinemaMap.keys()],
      validMovies: validMovieIds.size,
    });

    if (validMovieIds.size === 0) {
      console.log("[scheduleGen] Stop: No movies exist");
      return { created: 0, skipped: 0, message: "No movies exist" };
    }

    let created = 0;
    let skipped = 0;
    const today = dayStart(new Date());

    for (let i = 0; i < generateDays; i++) {
      const day = today.add(i, "day");
      const dayStartNative = day.toDate();
      const nextDayNative = day.add(1, "day").toDate();

      const activeMovies = movies
        .filter((m) => {
          const s = m.startDate ? dayStart(new Date(m.startDate)) : null;
          const e = m.endDate ? dayStart(new Date(m.endDate)) : null;
          if (s && day.isBefore(s, "day")) return false;
          if (e && day.isAfter(e, "day")) return false;
          return true;
        })
        .filter((m) => validMovieIds.has(m.movie_id.toString()));

      console.log("[scheduleGen] Day check:", {
        day: day.format("YYYY-MM-DD"),
        activeMovies: activeMovies.length,
      });

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
          console.log(
            "[scheduleGen] Skip theater (missing or no seats):",
            theaterId,
          );
          continue;
        }

        const branchKey = (theaterDoc.branch || theaterDoc.cinemaName || "")
          .trim()
          .toLowerCase();
        const cinemaId = cinemaMap.get(branchKey);
        if (!cinemaId) {
          skipped++;
          console.log("[scheduleGen] Skip theater (cinema not matched):", {
            theaterId,
            branch: theaterDoc.branch,
            cinemaName: theaterDoc.cinemaName,
            branchKey,
          });
          continue;
        }

        const existing = await Showtime.find({
          theater: theaterId,
          startTime: {
            $gte: dayStartNative,
            $lt: nextDayNative,
          },
        })
          .select("startTime")
          .lean();

        const existingTimestamps = new Set(
          existing.map((item) => new Date(item.startTime).getTime()),
        );

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

        const dayOffset = Math.max(
          0,
          theaterDocs.findIndex((t) => t._id.toString() === theaterId),
        );

        const toInsert = [];
        for (let idx = 0; idx < timeSlots.length; idx++) {
          const slot = timeSlots[idx];
          const startDate = slotToTime(day, slot).toDate();

          if (existingTimestamps.has(startDate.getTime())) {
            skipped++;
            continue;
          }

          const movieWindow =
            activeMovies[(idx + dayOffset) % activeMovies.length];

          toInsert.push({
            id_movie: movieWindow.movie_id,
            cinema: cinemaId,
            theater: theaterId,
            startTime: startDate,
            seats: seatsTemplate,
          });
        }

        console.log("[scheduleGen] Theater slots:", {
          day: day.format("YYYY-MM-DD"),
          theaterId,
          existingCount: existing.length,
          toInsertCount: toInsert.length,
          skippedSoFar: skipped,
        });

        if (toInsert.length === 0) continue;

        try {
          const inserted = await Showtime.insertMany(toInsert, {
            ordered: false,
          });
          created += inserted.length;
        } catch (err) {
          const isDuplicateError =
            err?.code === 11000 ||
            err?.name === "MongoBulkWriteError" ||
            err?.writeErrors?.some((e) => e.code === 11000);

          if (isDuplicateError) {
            const insertedCount =
              err?.insertedDocs?.length ?? err?.result?.nInserted ?? 0;
            created += insertedCount;
            skipped += Math.max(0, toInsert.length - insertedCount);
          } else {
            throw err;
          }
        }
      }
    }

    const pastLimit = today.subtract(1, "day").toDate();
    await Showtime.deleteMany({
      startTime: { $lt: pastLimit },
      "seats.isBooked": { $ne: true },
    });

    const result = {
      created,
      skipped,
      message: `Generated ${created} showtimes (${skipped} skipped existing slots)`,
    };
    console.log("[scheduleGen] Done:", result);
    return result;
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
