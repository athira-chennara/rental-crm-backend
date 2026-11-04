// external modules
const bcrypt = require("bcrypt");

// internal modules
const User = require("../db/models/userSchema");

// Get all users
exports.getAllUsers = async (req, res) => {
	try {
		const { search = "", page = 1, limit = 10, role = "" } = req.query;

		const searchQuery = {
			role,
			_id: { $ne: req.user.id },
		};

		if (search) {
			searchQuery.$or = [
				{ userName: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
			];
		}

		// Pagination
		const skip = (Number(page) - 1) * Number(limit);

		// Fetch users and count
		const [users, totalUsers] = await Promise.all([
			User.find(searchQuery)
				.select("-password")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit)),

			User.countDocuments(searchQuery),
		]);

		return res.status(200).json({
			success: true,
			users,
			pagination: {
				totalUsers,
				currentPage: Number(page),
				totalPages: Math.ceil(totalUsers / Number(limit)),
				limit: Number(limit),
			},
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Get user by ID
exports.getUserById = async (req, res) => {
	try {
		const { id } = req.params;

		// Find user
		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "User fetched successfully.",
			user,
		});
	} catch (error) {
		console.error(error);

		if (error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: "Invalid user ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Update user
exports.updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { userName, email, role } = req.body;

		// Check whether user exists
		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		// Update user
		const updatedUser = await User.findByIdAndUpdate(
			id,
			{
				$set: {
					userName,
					email,
					role,
				},
			},
			{
				new: true,
				runValidators: true,
			},
		);

		return res.status(200).json({
			success: true,
			message: "User updated successfully.",
			user: updatedUser,
		});
	} catch (error) {
		console.error(error);

		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "Email already exists.",
			});
		}

		if (error.name === "ValidationError") {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		if (error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: "Invalid user ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Change password
exports.changePassword = async (req, res) => {
	try {
		const { currentPassword, newPassword } = req.body;

		// Find user and include password
		const user = await User.findById(req.user.id).select("+password");

		if (!user || !user.isActive) {
			return res.status(404).json({
				success: false,
				message: "User not found or inactive.",
			});
		}

		// Verify current password
		const isPasswordValid = await bcrypt.compare(
			currentPassword,
			user.password,
		);

		if (!isPasswordValid) {
			return res.status(401).json({
				success: false,
				message: "Current password is incorrect.",
			});
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		await User.findByIdAndUpdate(
			req.user.id,
			{ $set: { password: hashedPassword } },
			{ runValidators: true },
		);

		return res.status(200).json({
			success: true,
			message: "Password changed successfully.",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Deactivate user
exports.deactivateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { isActive } = req.body;

		// Prevent admin from deactivating their own account
		if (req.user.id === id) {
			return res.status(400).json({
				success: false,
				message: "You cannot deactivate your own account.",
			});
		}

		// if (req.user.role !== "staff") {
		// 	return res.status(403).json({
		// 		success: false,
		// 		message: "Only staff accounts can be deactivated here.",
		// 	});
		// }

		const user = await User.findByIdAndUpdate(
			id,
			{ $set: { isActive: isActive } },
			{ new: true, runValidators: true },
		);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "User deactivated successfully.",
			user,
		});
	} catch (error) {
		console.error(error);

		if (error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: "Invalid user ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// delete user
exports.deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		// Prevent deleting your own account
		if (req.user.id === id) {
			return res.status(400).json({
				success: false,
				message: "You cannot delete your own account.",
			});
		}

		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		await User.findByIdAndDelete(id);

		return res.status(200).json({
			success: true,
			message: "Staff deleted successfully.",
		});
	} catch (error) {
		if (error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: "Invalid user ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Failed to delete staff.",
		});
	}
};
