const Product = require("../db/models/productSchema");
const Category = require("../db/models/categorySchema");

// Create product
exports.createProduct = async (req, res) => {
	try {
		const { productName, category, description, rentalRate, securityDeposit } =
			req.body;

		// Check category
		const categoryExist = await Category.findById(category);

		if (!categoryExist || !categoryExist.isActive) {
			return res.status(400).json({
				success: false,
				message: "Invalid or inactive category.",
			});
		}

		const product = new Product({
			productName,
			category,
			description,
			rentalRate,
			securityDeposit,
		});

		await product.save();

		await product.populate("category", "categoryName");

		return res.status(201).json({
			success: true,
			message: "Product created successfully.",
			product,
		});
	} catch (error) {
		console.log(error);

		if (error.name === "ValidationError") {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		if (error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: "Invalid category ID.",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Failed to create product.",
		});
	}
};

// Get all products
exports.getAllProducts = async (req, res) => {
	try {
		const { search = "", page = 1, limit = 10 } = req.query;

		const pageNumber = Number(page);
		const limitNumber = Number(limit);

		if (
			!Number.isInteger(pageNumber) ||
			!Number.isInteger(limitNumber) ||
			pageNumber < 1 ||
			limitNumber < 1
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid pagination values.",
			});
		}

		const searchQuery = {
			productName: { $regex: search, $options: "i" },
		};

		// Also search by category name
		if (search.trim()) {
			const matchingCategories = await Category.find({
				categoryName: { $regex: search, $options: "i" },
			}).select("_id");

			searchQuery.$or = [
				{ productName: { $regex: search, $options: "i" } },
				{ category: { $in: matchingCategories.map((item) => item._id) } },
			];

			delete searchQuery.productName;
		}

		const totalProducts = await Product.countDocuments(searchQuery);

		const products = await Product.find(searchQuery)
			.populate("category", "categoryName")
			.sort({ createdAt: -1 })
			.skip((pageNumber - 1) * limitNumber)
			.limit(limitNumber);

		return res.status(200).json({
			success: true,
			message: "Products fetched successfully.",
			products,
			pagination: {
				currentPage: pageNumber,
				limit: limitNumber,
				totalProducts,
				totalPages: Math.ceil(totalProducts / limitNumber),
			},
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			success: false,
			message: "Failed to fetch products.",
		});
	}
};

// Get product by ID
exports.getProductById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product ID.",
			});
		}

		const product = await Product.findById(id).populate(
			"category",
			"categoryName",
		);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Product fetched successfully.",
			product,
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			success: false,
			message: "Failed to fetch product.",
		});
	}
};

// Update product
exports.updateProduct = async (req, res) => {
	try {
		const { id } = req.params;

		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product ID.",
			});
		}

		const {
			productName,
			category,
			description,
			rentalRate,
			securityDeposit,
			isActive,
		} = req.body;

		// Validate category if supplied
		if (category !== undefined) {
			const categoryExist = await Category.findById(category);

			if (!categoryExist || !categoryExist.isActive) {
				return res.status(400).json({
					success: false,
					message: "Invalid or inactive category.",
				});
			}
		}

		const updateData = {};

		if (productName !== undefined) updateData.productName = productName;
		if (category !== undefined) updateData.category = category;
		if (description !== undefined) updateData.description = description;
		if (rentalRate !== undefined) updateData.rentalRate = rentalRate;
		if (securityDeposit !== undefined)
			updateData.securityDeposit = securityDeposit;
		if (isActive !== undefined) updateData.isActive = isActive;

		const product = await Product.findByIdAndUpdate(
			id,
			{ $set: updateData },
			{
				returnDocument: "after",
				runValidators: true,
			},
		).populate("category", "categoryName");

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Product updated successfully.",
			product,
		});
	} catch (error) {
		console.log(error);

		if (error.name === "ValidationError" || error.name === "CastError") {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		return res.status(500).json({
			success: false,
			message: "Failed to update product.",
		});
	}
};

// Delete product
exports.deleteProduct = async (req, res) => {
	try {
		const { id } = req.params;

		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid product ID.",
			});
		}

		const product = await Product.findById(id);

		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found.",
			});
		}

		// TODO: Before permanent deletion, check whether
		// assets or rental records reference this product.

		await Product.findByIdAndDelete(id);

		return res.status(200).json({
			success: true,
			message: "Product deleted successfully.",
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			success: false,
			message: "Failed to delete product.",
		});
	}
};
