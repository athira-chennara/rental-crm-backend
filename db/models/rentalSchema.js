const mongoose = require("mongoose");

const rentalSchema = mongoose.Schema(
	{
		rentalNumber: {
			type: String,
			unique: true,
			required: true,
			trim: true,
		},

		customer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Customer",
			required: true,
		},

		assets: [
			{
				asset: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Asset",
					required: true,
				},
				rentalRate: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],

		startDate: {
			type: Date,
			required: true,
		},

		expectedReturnDate: {
			type: Date,
			required: true,
		},

		actualReturnDate: {
			type: Date,
			default: null,
		},

		rentalAmount: {
			type: Number,
			required: true,
			min: 0,
		},

		securityDeposit: {
			type: Number,
			required: true,
			min: 0,
		},

		lateFee: {
			type: Number,
			default: 0,
			min: 0,
		},

		damageCharge: {
			type: Number,
			default: 0,
			min: 0,
		},

		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},

		status: {
			type: String,
			enum: ["reserved", "active", "completed", "cancelled"],
			default: "reserved",
		},

		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		paymentStatus: {
			type: String,
			enum: ["unpaid", "partially_paid", "paid"],
			default: "unpaid",
		},
	},
	{ timestamps: true },
);

const Rental = mongoose.model("Rental", rentalSchema);

module.exports = Rental;
