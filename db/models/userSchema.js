// external modules
const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
	{
		userName: {
			trim: true,
			type: String,
			required: true,
		},
		email: {
			trim: true,
			unique: true,
			type: String,
			lowercase: true,
			required: true,
			match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // to validate the email format
		},
		password: {
			trim: true,
			type: String,
			required: true,
			minlength: 8,
			select: false,
		},
		role: {
			type: String,
			required: true,
			enum: ["staff", "admin"],
			default: "staff",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
