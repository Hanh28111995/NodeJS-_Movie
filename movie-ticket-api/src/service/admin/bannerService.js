import bannerRepository from "../../repository/bannerRepository.js";
import movieRepository from "../../repository/movieRepository.js";
import { uploadToFirebase, deleteFromFirebase } from "../../helper/firebaseStorage.js";
import redisClient from "../../config/Redis.js";

class BannerService {
  async getAllBanners() {
    const cacheKey = "cache:banners";

    // 1. Kiểm tra cache Redis trước để tăng tốc độ phản hồi
    const cachedBanners = await redisClient.get(cacheKey).catch(() => null);
    if (cachedBanners) {
      return { banners: JSON.parse(cachedBanners) };
    }

    // 2. Nếu chưa có cache, lấy toàn bộ từ Database
    const banners = await bannerRepository.findAll();

    // 3. Lưu vào Redis cache (ví dụ lưu trong 1 giờ hoặc tùy chỉnh)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(banners)).catch(() => {});

    return { banners };
  }

  async getBannerById(bannerId) {
    const banner = await bannerRepository.findById(bannerId);
    if (!banner) {
      const error = new Error("Banner not found");
      error.statusCode = 404;
      throw error;
    }
    return banner;
  }

  async addBanner({ movie_id, highlight }, file) {
    if (!movie_id) {
      const error = new Error("movie_id is required");
      error.statusCode = 400;
      throw error;
    }

    const movie = await movieRepository.findById(movie_id);
    if (!movie) {
      const error = new Error("Movie not found");
      error.statusCode = 404;
      throw error;
    }

    if (!file) {
      const error = new Error("Banner image is required");
      error.statusCode = 400;
      throw error;
    }

    const { publicUrl } = await uploadToFirebase(file, "banner");
    const newBanner = await bannerRepository.create({
      url: publicUrl,
      movie_id,
      highlight,
    });

    // Xóa cache ngay lập tức để lần gọi sau load dữ liệu mới nhất
    await redisClient.del("cache:banners").catch(console.error);

    return newBanner;
  }

  async updateBanner(bannerId, { movie_id, highlight }, file) {
    const banner = await bannerRepository.findByIdRaw(bannerId);
    if (!banner) {
      const error = new Error("Banner not found");
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (highlight !== undefined) updateData.highlight = highlight;

    if (movie_id) {
      const movie = await bannerRepository.findMovieById(movie_id);
      if (!movie) {
        const error = new Error("Movie not found");
        error.statusCode = 404;
        throw error;
      }
      updateData.movie_id = movie_id;
    }

    let oldImageUrl = null;
    if (file) {
      const { publicUrl } = await uploadToFirebase(file, "banner");
      oldImageUrl = banner.url;
      updateData.url = publicUrl;
    }

    const updatedBanner = await bannerRepository.updateById(bannerId, updateData);

    if (file && oldImageUrl) {
      await deleteFromFirebase(oldImageUrl).catch(console.error);
    }

    // Xóa cache ngay lập tức
    await redisClient.del("cache:banners").catch(console.error);

    return updatedBanner;
  }

  async deleteBanner(bannerId) {
    const banner = await bannerRepository.findByIdRaw(bannerId);
    if (!banner) {
      const error = new Error("Banner not found");
      error.statusCode = 404;
      throw error;
    }

    if (banner.url) {
      await deleteFromFirebase(banner.url).catch(console.error);
    }

    await bannerRepository.deleteById(bannerId);

    // Xóa cache ngay lập tức
    await redisClient.del("cache:banners").catch(console.error);

    return true;
  }
}

export default new BannerService();