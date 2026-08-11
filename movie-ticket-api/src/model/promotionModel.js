import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
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
		content: {
			type: String,
			required: true,
		},
		startDate: {
			type: Date,
			required: false,
		},
		endDate: {
			type: Date,
			required: false,
		},
	},
	{
		timestamps: true,
		collection: "promotions",
	}
);

promotionSchema.index({ title: "text" });

const Promotion = mongoose.model("promotions", promotionSchema);

export default Promotion;

