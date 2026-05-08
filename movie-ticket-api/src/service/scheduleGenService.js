import ScheduleConfig from "../model/scheduleConfigModel.js";
import Showtime from "../model/showtimeModel.js";
import Theater from "../model/theaterModel.js";
import Cinema from "../model/cinemaModel.js";
import SeatType from "../model/seatTypeModel.js";
import Movie from "../model/movieModel.js";
import mongoose from "mongoose";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const VN_TZ = "Asia/Ho_Chi_Minh";

const VN_OFFSET = 7 * 60 * 60 * 1000;

export const getConfig = async () => {
  return await ScheduleConfig.findOne().lean();
};

export const createConfig = async ({
  movie_ids,
  timeSlots,
  theaters,
  scheduleTime,
}) => {
  const existing = await ScheduleConfig.findOne();
  if (existing) throw new Error("Đã có cấu hình, dùng /update để cập nhật");
  return await ScheduleConfig.create({
    movie_ids,
    timeSlots,
    theaters,
    scheduleTime,
    isActive: true,
  });
};

export const updateConfig = async ({
  movie_ids,
  timeSlots,
  theaters,
  scheduleTime,
  isActive,
}) => {
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
  if (!config) throw new Error("Chưa có cấu hình, dùng /create để tạo mới");
  return config;
};

const getVNDayStart = (date) => {
  return dayjs(date).startOf("day");
};

const slotToStartTime = (baseDayjs, slot) => {
  const [hours, minutes] = slot.split(":").map(Number);
  // Trả về đối tượng dayjs đã được set giờ phút
  return baseDayjs.hour(hours).minute(minutes).second(0).millisecond(0);
};

export const generate = async () => {
  try {
    const config = await ScheduleConfig.findOne({ isActive: true }).lean();
    if (!config)
      return {
        created: 0,
        updated: 0,
        skipped: 0,
        message: "Không có cấu hình đang hoạt động",
      };

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
        message: "Cấu hình không hợp lệ (movie_ids/theaters/timeSlots)",
      };
    }

    const invalidMovieIds = rawMovies.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
    const invalidTheaterIds = rawTheaters.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
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
        message:
          "Cấu hình không hợp lệ (movie_ids/theaters không phải ObjectId hợp lệ)",
        invalidMovieIds,
        invalidTheaterIds,
      };
    }

    const [existingMovies, theaterDocs] = await Promise.all([
      Movie.find({ _id: { $in: validMovieIds } })
        .select("_id")
        .lean(),
      Theater.find({ _id: { $in: validTheaterIds } })
        .select("_id cinemaName seats")
        .lean(),
    ]);

    const movies = existingMovies.map((m) => m._id.toString());
    const theaters = theaterDocs.map((t) => t._id.toString());
    const missingMovieIds = validMovieIds.filter((id) => !movies.includes(id));
    const missingTheaterIds = validTheaterIds.filter(
      (id) => !theaters.includes(id),
    );

    if (movies.length === 0 || theaters.length === 0) {
      return {
        created: 0,
        updated: 0,
        skipped: 0,
        message:
          "Không thể generate vì movie/theater trong cấu hình không tồn tại trong DB",
        invalidMovieIds,
        invalidTheaterIds,
        missingMovieIds,
        missingTheaterIds,
      };
    }

    const todayStart = getVNDayStart(new Date());
    const yesterdayStart = todayStart.subtract(1, "day");
    const tomorrowStart = todayStart.add(1, "day");

    const yesterdaySlotTimes = timeSlots.map((s) =>
      slotToStartTime(yesterdayStart, s),
    );
    const todaySlotTimes = timeSlots.map((s) => slotToStartTime(todayStart, s));

    if (yesterdaySlotTimes.length === 0 || todaySlotTimes.length === 0) {
      return {
        created: 0,
        updated: 0,
        skipped: 0,
        message: "timeSlots không hợp lệ",
      };
    }

    const [yesterdayShowtimes, todayShowtimes] = await Promise.all([
      Showtime.find({
        theater: { $in: theaters },
        id_movie: { $in: movies },
        startTime: { $in: yesterdaySlotTimes },
        "seats.isBooked": { $ne: true },
      })
        .select("_id theater startTime")
        .lean(),
      Showtime.find({
        theater: { $in: theaters },
        startTime: { $gte: todayStart, $lt: tomorrowStart },
      })
        .select("_id theater startTime")
        .lean(),
    ]);

    const yesterdayIndexByTime = new Map(
      yesterdaySlotTimes.map((t, idx) => [t.toISOString(), idx]), // dayjs hỗ trợ toISOString()
    );

    const occupiedKey = new Set(
      todayShowtimes.map(
        (s) => `${s.theater.toString()}|${dayjs(s.startTime).toISOString()}`,
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

    let updated = 0;
    if (updateOps.length > 0) {
      const r = await Showtime.bulkWrite(updateOps, { ordered: false });
      updated = r.modifiedCount ?? 0;
    }

    const cinemaNames = [
      ...new Set(theaterDocs.map((t) => t.cinemaName).filter(Boolean)),
    ];
    const cinemaDocs = await Cinema.find({ cinemaName: { $in: cinemaNames } })
      .select("_id cinemaName")
      .lean();
    const cinemaMap = Object.fromEntries(
      cinemaDocs.map((c) => [c.cinemaName, c._id]),
    );

    const seatTypeIds = [
      ...new Set(
        theaterDocs
          .flatMap((t) => (t.seats || []).map((s) => s.seatType?.toString()))
          .filter(Boolean),
      ),
    ];
    const seatTypes = await SeatType.find({ _id: { $in: seatTypeIds } })
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
    let skippedNoCinema = 0;
    let skippedNoSeats = 0;
    for (let ti = 0; ti < theaters.length; ti++) {
      const theaterId = theaters[ti];
      const theaterDoc = theaterDocs.find(
        (t) => t._id.toString() === theaterId,
      );
      if (!theaterDoc) continue;
      const cinemaId = cinemaMap[theaterDoc.cinemaName];
      if (!cinemaId) {
        skippedNoCinema++;
        continue;
      }
      if (!Array.isArray(theaterDoc.seats) || theaterDoc.seats.length === 0) {
        skippedNoSeats++;
        continue;
      }

      for (let slotIndex = 0; slotIndex < todaySlotTimes.length; slotIndex++) {
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

    let created = 0;
    if (newShowtimes.length > 0) {
      const inserted = await Showtime.insertMany(newShowtimes, {
        ordered: false,
      });
      created = inserted.length;
    }

    const expected = theaters.length * todaySlotTimes.length;
    const skipped = Math.max(0, expected - (created + updated));

    return {
      created,
      updated,
      skipped,
      message: `Đã tạo ${created} và cập nhật ${updated} suất chiếu.`,
      date: todayStart.toISOString(),
      invalidMovieIds,
      invalidTheaterIds,
      missingMovieIds,
      missingTheaterIds,
      skippedNoCinema,
      skippedNoSeats,
    };
  } catch (err) {
    return {
      created: 0,
      updated: 0,
      skipped: 0,
      message: `Generate thất bại: ${err.message}`,
    };
  }
};
