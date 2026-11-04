const mongoose = require("mongoose");

const assetSchema = mongoose.Schema(
	{
		product: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},

		assetCode: {
			type: String,
			trim: true,
			required: true,
			unique: true,
		},

		serialNumber: {
			type: String,
			trim: true,
			default: null,
		},

		condition: {
			type: String,
			enum: ["excellent", "good", "fair", "damaged"],
			default: "good",
		},

		status: {
			type: String,
			enum: ["available", "reserved", "rented", "maintenance", "retired"],
			default: "available",
		},

		purchaseDate: {
			type: Date,
			default: null,
		},

		purchasePrice: {
			type: Number,
			min: 0,
			default: 0,
		},

		notes: {
			type: String,
			trim: true,
			default: "",
		},
	},
	{ timestamps: true },
);

const Asset = mongoose.model("Asset", assetSchema);

module.exports = Asset;
