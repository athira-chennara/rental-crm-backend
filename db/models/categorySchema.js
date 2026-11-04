const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
	{
		categoryName: {
			type: String,
			trim: true,
			required: true,
			unique: true,
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
