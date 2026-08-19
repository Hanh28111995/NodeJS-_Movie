import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    movie_id: {
      type: String,
      required: true,
      trim: true,
    },
    highlight: {
      type: Boolean,
      default: false,            
    },
  },
  {
    timestamps: true,
    collection: "banners",
  }
);

bannerSchema.index({ movie_id: 1 });

const Banner = mongoose.model("banners", bannerSchema);

export default Banner;
