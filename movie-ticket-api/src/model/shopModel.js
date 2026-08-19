import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    choices: [{ type: String }],
    required: { type: Boolean, default: false },
  },
  { _id: false },
);

const shopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    banner: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    stock: {
      type: Number,
      default: null,
    },
    limitPerCustomer: {
      type: Number,
      default: 0,
    },
    expiryDays: {
      type: Number,
      default: null,
    },
    options: {
      type: [optionSchema],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    highlight: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "shops",
  },
);

shopSchema.index({ title: "text" });
shopSchema.index({ id_shop: 1 });

const Shop = mongoose.model("shops", shopSchema);

export default Shop;
