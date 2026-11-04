// external modules
const mongoose = require("mongoose");

const customerSChema = mongoose.Schema(
	{
		customerName: {
			trim: true,
			type: String,
			required: true,
		},
		phone: {
			trim: true,
			type: String,
			required: true,
			unique: true,
			match: /^\+91[6-9][0-9]{9}$/, // to validate phone number eg: +91 + 10 digits
		},
		gender: {
			type: String,
			enum: ["male", "female", "other"],
		},
		address: {
			houseName: {
				trim: true,
				type: String,
				default: null,
			},
			location: {
				trim: true,
				type: String,
				default: null,
			},
			pincode: {
				trim: true,
				type: String,
				default: null,
			},
			postOffice: {
				trim: true,
				type: String,
				default: null,
			},
			district: {
				trim: true,
				type: String,
				default: null,
			},
			state: {
				trim: true,
				type: String,
				default: "India",
			},
		},
	},
	{ timestamps: true },
);

const Customer = mongoose.model("Customer", customerSChema);

module.exports = Customer;
