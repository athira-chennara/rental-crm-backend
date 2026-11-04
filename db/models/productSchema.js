const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
	{
		productName: {
			type: String,
			trim: true,
			required: true,
		},
		category: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			required: true,
		},
		description: {
			type: String,
			trim: true,
			default: "",
		},
		rentalRate: {
			type: Number,
			required: true,
			min: 0,
		},
		securityDeposit: {
			type: Number,
			required: true,
			min: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
