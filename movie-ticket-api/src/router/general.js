import { sendSuccess, sendError } from "../helper/client.js";
import express from "express";
import Movie from "../model/movieModel.js";
import Cinema from "../model/cinemaModel.js";
import Showtime from "../model/showtimeModel.js";
import Promotion from "../model/promotionModel.js";
import Shop from "../model/shopModel.js";
import Banner from "../model/bannerModel.js";
import asyncHandler from "../util/asyncHandler.js";
import Theater from "../model/theaterModel.js";
import SeatType from "../model/seatTypeModel.js";

const generalRouter = express.Router();

// Helper để thêm cache header: 5 phút cache, 30 giây revalidate ngầm
const addCacheHeader = (res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=30');
};

generalRouter.get("/showingMovies", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gte: now } })
    .populate({
      path: "id_movie",
      select: "title banner duration genre releaseDate" // Chỉ lấy các trường cần thiết
    })
    .lean();
  
  const movies = [...new Map(showtimes.map((st) => [st.id_movie._id.toString(), st.id_movie])).values()];
  return sendSuccess(res, "Now showing movies retrieved successfully", movies);
}));

generalRouter.get("/comingMovies", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const now = new Date();
  const showtimes = await Showtime.find({ startTime: { $gt: now } })
    .populate({
      path: "id_movie",
      select: "title banner duration genre releaseDate"
    })
    .lean();

  const movies = [...new Map(showtimes.map((st) => [st.id_movie._id.toString(), st.id_movie])).values()];
  return sendSuccess(res, "Coming soon movies retrieved successfully", movies);
}));

generalRouter.get("/showBanners", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const banners = await Banner.find()
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(res, "Banners retrieved successfully", banners);
}));

generalRouter.get("/movie/all", asyncHandler(async (req, res) => {
  const { title } = req.query;
  const query = title ? { title: { $regex: title, $options: "i" } } : {};
  const movies = await Movie.find(query).sort({ releaseDate: -1 }).lean();
  return sendSuccess(res, "All movies retrieved successfully", movies);
}));

generalRouter.get("/movie/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === "all") {
    addCacheHeader(res);
    const { title } = req.query;
    const query = title ? { title: { $regex: title, $options: "i" } } : {};
    const movies = await Movie.find(query).sort({ releaseDate: -1 }).lean();
    return sendSuccess(res, "All movies retrieved successfully", movies);
  }

  // Tìm theo id_movie (nanoid) hoặc _id (ObjectId)
  const movie = await Movie.findOne({
    $or: [
      { id_movie: id },
      ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : [])
    ]
  }).lean();

  if (!movie) return sendError(res, "Movie not found", 404);
  return sendSuccess(res, "Movie retrieved successfully", movie);
}));

generalRouter.get("/cinema", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const cinemas = await Cinema.find().lean();
  return sendSuccess(res, "All cinemas retrieved successfully", cinemas);
}));

generalRouter.get("/cinemaBranches", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const { location } = req.query;

  let query = {};
  if (location) {
    query.address = { $regex: location, $options: "i" };
  }

  const cinemas = await Cinema.find(query)
    .select("branch cinemaName address coordinates")
    .lean();

  return sendSuccess(res, "Cinema branches retrieved successfully", cinemas);
}));

generalRouter.get("/locations", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const cinemas = await Cinema.find().select("address").lean();

  const locationMap = {};

  cinemas.forEach((c) => {
    const parts = c.address.split(",").map(p => p.trim());
    if (parts.length >= 2) {
      const city = parts[parts.length - 1];
      const district = parts[parts.length - 2];

      if (!locationMap[city]) {
        locationMap[city] = {
          _id: city,
          vungMien: city,
          cumRap: new Set()
        };
      }
      locationMap[city].cumRap.add(district);
    }
  });

  const formattedLocations = Object.values(locationMap).map(item => ({
    ...item,
    cumRap: Array.from(item.cumRap)
  }));

  return sendSuccess(res, "Locations retrieved successfully", formattedLocations);
}));

generalRouter.get("/theaterByCinema", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const theaters = await Cinema.find().populate("theaters").lean();
  return sendSuccess(res, "All theaters retrieved successfully", theaters);
}));

generalRouter.get("/theaters/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;
  const theaterTarget = await Theater.findById(id).lean();
  if (!theaterTarget) return sendError(res, "Theater not found", 404);
  return sendSuccess(res, "Theater retrieved successfully", theaterTarget);
}));

generalRouter.get("/showtime/filter", asyncHandler(async (req, res) => {
  // Không cache API này vì dữ liệu showtime thay đổi liên tục và phụ thuộc query params phức tạp
  const { branch, date, idMovie } = req.query;

  let conditions = [];

  if (idMovie) {
    conditions.push({ id_movie: idMovie });
  }

  if (branch) {
    const theaterIds = await Theater.find({
      $or: [{ branch: branch }, { cinemaName: branch }]
    }).distinct("_id");
    if (theaterIds.length === 0) {
      return sendSuccess(res, "Filtered showtimes retrieved successfully", []);
    }
    conditions.push({ theater: { $in: theaterIds } });
  }

  if (date) {
    const d1 = new Date(date);
    const d2 = new Date(date);
    d2.setDate(d2.getDate() + 1);
    conditions.push({ startTime: { $gte: d1, $lt: d2 } });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  const showtimes = await Showtime.find(query)
    .select("_id startTime theater")
    .lean();

  return sendSuccess(res, "Filtered showtimes retrieved successfully", showtimes);
}));

generalRouter.get("/seatTypes", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const seatTypes = await SeatType.find().lean();
  return sendSuccess(res, "All seat types retrieved successfully", seatTypes);
}));

generalRouter.get("/promotion/all", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const promotions = await Promotion.find()
    .select("banner startDate endDate")
    .sort({ startDate: -1 })
    .lean();

  return sendSuccess(res, "Promotions retrieved successfully", promotions);
}))

generalRouter.get("/promotion/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === "all") {
    addCacheHeader(res);
    const promotions = await Promotion.find()
      .select("banner startDate endDate")
      .sort({ startDate: -1 })
      .lean();
    return sendSuccess(res, "Promotions retrieved successfully", promotions);
  }

  const promotion = await Promotion.findById(id).lean();
  if (!promotion) return sendError(res, "Promotion not found", 404);
  return sendSuccess(res, "Promotion retrieved successfully", promotion);
}))

generalRouter.get("/shop/all", asyncHandler(async (req, res) => {
  addCacheHeader(res);
  const { area, theater, productName, priceSort, productType } = req.query;
  const query = {};
  
  if (productName) {
    query.title = { $regex: productName, $options: "i" };
  }

  if (area) {
    query.area = area;
  }

  if (theater) {
    query.theater = theater;
  }
  
  if (productType) {
    query.productType = productType;
  }

  let sortQuery = { createdAt: -1 }; // Mặc định mới nhất lên đầu
  if (priceSort) {
    const sortOrder = priceSort.toLowerCase() === "asc" ? 1 : -1;
    sortQuery = { price: sortOrder };
  }

  const shops = await Shop.find(query)
    .select("title banner price area theater productType") // Bổ sung thêm các trường cho phù hợp nếu cần
    .sort(sortQuery)
    .lean();

  return sendSuccess(res, "Shop products retrieved successfully", shops);
}));

generalRouter.get("/shop/:id", asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id === "all") {
    addCacheHeader(res);
    const shops = await Shop.find()
      .select("title banner price")
      .sort({ createdAt: -1 })
      .lean();
    return sendSuccess(res, "Shop products retrieved successfully", shops);
  }

  const shop = await Shop.findOne({
    $or: [
      { id_shop: id },
      ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : []),
    ],
  }).lean();

  if (!shop) return sendError(res, "Shop product not found", 404);
  return sendSuccess(res, "Shop product retrieved successfully", shop);
}))

export default generalRouter;
