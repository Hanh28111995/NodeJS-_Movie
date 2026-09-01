import ScheduleConfig from "../model/scheduleConfigModel.js";
import cinemaRepository from "../repository/cinemaRepository.js";
import movieRepository from "../repository/movieRepository.js";
import theaterRepository from "../repository/theaterRepository.js";
import showtimeRepository from "../repository/showtimeRepository.js";
import seatTypeRepository from "../repository/seatTypeRepository.js";
import mongoose from "mongoose";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import Showtime from "../model/showtimeModel.js";

dayjs.extend(utc);
dayjs.extend(timezone);

class ScheduleService {
  async getConfig() {
    return await ScheduleConfig.findOne().lean();
  }

  async createConfig({ movie_ids, timeSlots, theaters, scheduleTime }) {
    const existing = await ScheduleConfig.findOne();
    if (existing) {
      const error = new Error(
        "Configuration already exists, use update instead",
      );
      error.statusCode = 400;
      throw error;
    }
    return await ScheduleConfig.create({
      movie_ids,
      timeSlots,
      theaters,
      scheduleTime,
      isActive: true,
    });
  }

  async updateConfig({
    movie_ids,
    timeSlots,
    theaters,
    scheduleTime,
    isActive,
  }) {
    const config = await ScheduleConfig.findOneAndUpdate(
      {},
      {
        movie_ids,
        timeSlots,
        theaters,
        scheduleTime,
        ...(isActive !== undefined && { isActive }),
      },
      { new: true },
    );
    if (!config) {
      const error = new Error("Configuration not found, use create first");
      error.statusCode = 404;
      throw error;
    }
    return config;
  }

  #getVNDayStart(date) {
    return dayjs(date).startOf("day");
  }

  #slotToStartTime(baseDayjs, slot) {
    const [hours, minutes] = slot.split(":").map(Number);
    return baseDayjs.hour(hours).minute(minutes).second(0).millisecond(0);
  }

  async generateSchedule() {
    try {
      const config = await ScheduleConfig.findOne({ isActive: true }).lean();
      if (!config) {
        return {
          created: 0,
          updated: 0,
          skipped: 0,
          message: "No active configuration found",
        };
      }

      const todayStart = this.#getVNDayStart(new Date());
      const tomorrowStart = todayStart.add(1, "day");
      const scheduleType = config.scheduleTime ?? 1; // 1=Daily, 2=Weekly, 3=Monthly

      // ==========================================
      // 1. NGHIỆP VỤ XÓA SHOWTIME CŨ THEO SCHEDULETIME
      // ==========================================
      let cleanupQueryLimitDate = null;

      if (scheduleType === 1) {
        // Daily: Xóa các suất chiếu trước ngày hôm qua (tức là < ngày hôm qua)
        // Ngày hôm qua bắt đầu từ:
        const yesterdayStart = todayStart.subtract(1, "day");
        cleanupQueryLimitDate = yesterdayStart;
      } else if (scheduleType === 2) {
        // Weekly: Xóa các suất chiếu trước tuần trước đó (tức là < 7 ngày trước)
        cleanupQueryLimitDate = todayStart.subtract(7, "day");
      } else if (scheduleType === 3) {
        // Monthly: Xóa các suất chiếu trước tháng trước đó (tức là < 30 ngày trước)
        cleanupQueryLimitDate = todayStart.subtract(30, "day");
      }

      if (cleanupQueryLimitDate) {
        // Thực hiện xóa các suất chiếu cũ quá hạn theo chu kỳ
        // (Tùy bạn có muốn giữ điều kiện "seats.isBooked: { $ne: true }" hay xóa sạch cả vé cũ tùy nghiệp vụ)
        await Showtime.deleteMany({
          startTime: { $lt: cleanupQueryLimitDate },
          "seats.isBooked": { $ne: true }, // An toàn: chỉ xóa lịch cũ chưa có khách đặt vé
        });
      }

      // ==========================================
      // 2. XỬ LÝ LỊCH CHIẾU CHO NGÀY HÔM NAY (như logic hiện tại)
      // ==========================================
      const rawMovies = (config.movie_ids || [])
        .map((m) => m?.toString?.())
        .filter(Boolean);
      const rawTheaters = (config.theaters || [])
        .map((t) => t?.toString?.())
        .filter(Boolean);
      const timeSlots = (config.timeSlots || []).filter(Boolean);

      if (
        rawMovies.length === 0 ||
        rawTheaters.length === 0 ||
        timeSlots.length === 0
      ) {
        return {
          created: 0,
          updated: 0,
          skipped: 0,
          message: "Invalid configuration (movie_ids/theaters/timeSlots)",
        };
      }

      const validMovieIds = rawMovies.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );
      const validTheaterIds = rawTheaters.filter((id) =>
        mongoose.Types.ObjectId.isValid(id),
      );

      if (validMovieIds.length === 0 || validTheaterIds.length === 0) {
        return {
          created: 0,
          updated: 0,
          skipped: 0,
          message: "Invalid ObjectIds in configuration",
        };
      }

      const [existingMovies, theaterDocs] = await Promise.all([
        movieRepository.findByQuery({ _id: { $in: validMovieIds } }),
        theaterRepository.findByIds
          ? theaterRepository.findByIds(validTheaterIds)
          : Theater.find({ _id: { $in: validTheaterIds } })
              .select("_id cinemaName seats")
              .lean(),
      ]);

      const movies = existingMovies.map((m) => m._id.toString());
      const theaters = theaterDocs.map((t) => t._id.toString());

      if (movies.length === 0 || theaters.length === 0) {
        return {
          created: 0,
          updated: 0,
          skipped: 0,
          message:
            "Movies or theaters from configuration do not exist in database",
        };
      }

      const todaySlotTimes = timeSlots.map((s) =>
        this.#slotToStartTime(todayStart, s),
      );

      // Kiểm tra showtime hiện tại trong ngày hôm nay
      const todayShowtimes = showtimeRepository.findRange
        ? await showtimeRepository.findRange(
            theaters,
            todayStart,
            tomorrowStart,
          )
        : await Showtime.find({
            theater: { $in: theaters },
            startTime: { $gte: todayStart, $lt: tomorrowStart },
          })
            .select("_id theater startTime id_movie seats")
            .lean();

      const hasAnyShowtime = todayShowtimes.length > 0;
      const hasValidMovieInShowtimes = todayShowtimes.some((st) =>
        validMovieIds.includes(st.id_movie?.toString()),
      );

      let updated = 0;
      let created = 0;

      // NẾU HÔM NAY CHƯA CÓ LỊCH HOẶC PHIM KHÔNG KHỚP CONFIG -> XÓA TRẮNG HÔM NAY VÀ TẠO MỚI
      if (!hasAnyShowtime || !hasValidMovieInShowtimes) {
        await Showtime.deleteMany({
          theater: { $in: theaters },
          startTime: { $gte: todayStart, $lt: tomorrowStart },
        });

        const occupiedKey = new Set();

        const allCinemas = await cinemaRepository.findAll();
        const cinemaNames = [
          ...new Set(theaterDocs.map((t) => t.cinemaName).filter(Boolean)),
        ];
        const cinemaDocs = allCinemas.filter((c) =>
          cinemaNames.includes(c.cinemaName),
        );
        const cinemaMap = Object.fromEntries(
          cinemaDocs.map((c) => [c.cinemaName, c._id]),
        );

        const seatTypeIds = [
          ...new Set(
            theaterDocs
              .flatMap((t) =>
                (t.seats || []).map((s) => s.seatType?.toString()),
              )
              .filter(Boolean),
          ),
        ];

        const seatTypes = (await seatTypeRepository.findByIds)
          ? await seatTypeRepository.findByIds(seatTypeIds)
          : await SeatType.find({ _id: { $in: seatTypeIds } })
              .select("_id price color")
              .lean();

        const seatTypeMap = Object.fromEntries(
          seatTypes.map((st) => [st._id.toString(), st]),
        );

        const seatsTemplateByTheater = Object.fromEntries(
          theaterDocs.map((t) => {
            const seats = (t.seats || []).map((s) => {
              const st = seatTypeMap[s.seatType?.toString()];
              return {
                seatNumber: s.seatNumber,
                seatType: s.seatType,
                price: st?.price ?? 0,
                color: st?.color ?? "#cccccc",
                isBooked: false,
              };
            });
            return [t._id.toString(), seats];
          }),
        );

        const newShowtimes = [];
        for (let ti = 0; ti < theaters.length; ti++) {
          const theaterId = theaters[ti];
          const theaterDoc = theaterDocs.find(
            (t) => t._id.toString() === theaterId,
          );
          if (!theaterDoc) continue;
          const cinemaId = cinemaMap[theaterDoc.cinemaName];
          if (
            !cinemaId ||
            !Array.isArray(theaterDoc.seats) ||
            theaterDoc.seats.length === 0
          )
            continue;

          for (
            let slotIndex = 0;
            slotIndex < todaySlotTimes.length;
            slotIndex++
          ) {
            const startTime = todaySlotTimes[slotIndex];
            const key = `${theaterId}|${startTime.toISOString()}`;
            if (occupiedKey.has(key)) continue;

            const movieId = movies[(slotIndex + ti) % movies.length];
            if (!movieId) continue;

            newShowtimes.push({
              id_movie: movieId,
              theater: theaterId,
              cinema: cinemaId,
              startTime: startTime.toDate(),
              seats: seatsTemplateByTheater[theaterId] || [],
            });
            occupiedKey.add(key);
          }
        }

        if (newShowtimes.length > 0) {
          const inserted = await Showtime.insertMany(newShowtimes, {
            ordered: false,
          });
          created = inserted.length;
        }
      } else {
        // GIỮ NGUYÊN LOGIC ROLL-OVER TỪ HÔM QUA SANG HÔM NAY NẾU HÔM NAY ĐÃ HỢP LỆ
        const yesterdayStart = todayStart.subtract(1, "day");
        const yesterdaySlotTimes = timeSlots.map((s) =>
          this.#slotToStartTime(yesterdayStart, s),
        );

        const yesterdayShowtimes = showtimeRepository.findForScheduleRollOver
          ? await showtimeRepository.findForScheduleRollOver(
              theaters,
              movies,
              yesterdaySlotTimes,
            )
          : await Showtime.find({
              theater: { $in: theaters },
              id_movie: { $in: movies },
              startTime: { $in: yesterdaySlotTimes },
              "seats.isBooked": { $ne: true },
            })
              .select("_id theater startTime")
              .lean();

        const yesterdayIndexByTime = new Map(
          yesterdaySlotTimes.map((t, idx) => [t.toISOString(), idx]),
        );

        const occupiedKey = new Set(
          todayShowtimes.map(
            (s) =>
              `${s.theater.toString()}|${dayjs(s.startTime).toISOString()}`,
          ),
        );

        const updateOps = [];
        for (const st of yesterdayShowtimes) {
          const slotIndex = yesterdayIndexByTime.get(
            new Date(st.startTime).toISOString(),
          );
          if (slotIndex === undefined) continue;
          const newStartTime = todaySlotTimes[slotIndex];
          const key = `${st.theater.toString()}|${newStartTime.toISOString()}`;
          if (occupiedKey.has(key)) continue;

          updateOps.push({
            updateOne: {
              filter: { _id: st._id },
              update: {
                $set: { startTime: newStartTime, "seats.$[].isBooked": false },
              },
            },
          });
          occupiedKey.add(key);
        }

        if (updateOps.length > 0) {
          const r = await Showtime.bulkWrite(updateOps, { ordered: false });
          updated = r.modifiedCount ?? 0;
        }
      }

      const expected = theaters.length * todaySlotTimes.length;
      const skipped = Math.max(0, expected - (created + updated));

      return {
        created,
        updated,
        skipped,
        message: `Generated ${created} and updated ${updated} showtimes successfully.`,
        date: todayStart.toISOString(),
      };
    } catch (err) {
      const error = new Error(`Generation failed: ${err.message}`);
      error.statusCode = 500;
      throw error;
    }
  }
}

export default new ScheduleService();
