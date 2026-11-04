// external modules
const Customer = require("../db/models/customerSchema");

// Create customer
exports.createCustomer = async (req, res) => {
	try {
		const { customerName, phone, gender, address } = req.body;

		// Check whether customer already exists
		const customerExist = await Customer.findOne({ phone });

		// if customet already exists
		if (customerExist) {
			return res.status(400).json({
				success: false,
				message: "Customer already exists.",
			});
		}

		// Create customer
		const customer = await Customer.create({
			customerName,
			phone,
			gender,
			address,
		});

		return res.status(201).json({
			success: true,
			message: "Customer created successfully.",
			customer,
		});
	} catch (error) {
		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "Phone number already exists.",
			});
		}

		if (error.name === "ValidationError") {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
	try {
		// Get search and pagination values from query params
		const { search = "", page = 1, limit = 10 } = req.query;

		// Calculate how many documents to skip
		const skip = (Number(page) - 1) * Number(limit);

		// Search by customer name or phone
		const searchQuery = search
			? {
					$or: [
						{ customerName: { $regex: search, $options: "i" } },
						{ phone: { $regex: search, $options: "i" } },
					],
				}
			: {};

		// Fetch customers and total count
		const [customers, totalCustomers] = await Promise.all([
			Customer.find(searchQuery)
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit)),
			Customer.countDocuments(searchQuery),
		]);

		return res.status(200).json({
			success: true,
			message: "Customers fetched successfully.",
			customers,
			pagination: {
				totalCustomers,
				currentPage: Number(page),
				totalPages: Math.ceil(totalCustomers / Number(limit)),
				limit: Number(limit),
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
	try {
		const { id } = req.params;

		const customer = await Customer.findById(id);

		if (!customer) {
			return res.status(404).json({
				success: false,
				message: "Customer not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Customer fetched successfully.",
			customer,
		});
	} catch (error) {
		console.error(error);

		if (error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: "Invalid customer ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Update customer
exports.updateCustomer = async (req, res) => {
	try {
		const { id } = req.params;
		const { customerName, gender, phone, address } = req.body;

		// Find customer
		const customer = await Customer.findById(id);

		if (!customer) {
			return res.status(404).json({
				success: false,
				message: "Customer not found.",
			});
		}

		// Update only the fields provided
		const updatedCustomer = await Customer.findByIdAndUpdate(
			id,
			{ $set: { customerName, gender, phone, address } },
			{ new: true, runValidators: true },
		);

		return res.status(200).json({
			success: true,
			message: "Customer updated successfully.",
			customer: updatedCustomer,
		});
	} catch (error) {
		console.error(error);

		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "Phone number already exists.",
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
				message: "Invalid customer ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
	try {
		const { id } = req.params;

		// Find and delete customer
		const customer = await Customer.findByIdAndDelete(id);

		if (!customer) {
			return res.status(404).json({
				success: false,
				message: "Customer not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Customer deleted successfully.",
		});
	} catch (error) {
		console.error(error);

		if (error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: "Invalid customer ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Internal Server Error.",
		});
	}
};
