const Category = require("../db/models/categorySchema");
const Product = require("../db/models/productSchema");

// Create category
exports.createCategory = async (req, res) => {
	try {
		const { categoryName, description } = req.body;

		const categoryExist = await Category.findOne({
			categoryName: { $regex: `^${categoryName.trim()}$`, $options: "i" },
		});

		if (categoryExist) {
			return res.status(409).json({
				success: false,
				message: "Category already exists.",
			});
		}

		const category = new Category({
			categoryName,
			description,
		});

		await category.save();

		return res.status(201).json({
			success: true,
			message: "Category created successfully.",
			category,
		});
	} catch (error) {
		console.log(error);

		if (error.name === "ValidationError") {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		return res.status(500).json({
			success: false,
			message: "Failed to create category.",
		});
	}
};

// Get all categories
exports.getAllCategories = async (req, res) => {
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
			categoryName: { $regex: search, $options: "i" },
		};

		const totalCategories = await Category.countDocuments(searchQuery);

		const categories = await Category.find(searchQuery)
			.sort({ createdAt: -1 })
			.skip((pageNumber - 1) * limitNumber)
			.limit(limitNumber);

		return res.status(200).json({
			success: true,
			message: "Categories fetched successfully.",
			categories,
			pagination: {
				currentPage: pageNumber,
				limit: limitNumber,
				totalCategories,
				totalPages: Math.ceil(totalCategories / limitNumber),
			},
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			success: false,
			message: "Failed to fetch categories.",
		});
	}
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid category ID.",
			});
		}

		const category = await Category.findById(id);

		if (!category) {
			return res.status(404).json({
				success: false,
				message: "Category not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Category fetched successfully.",
			category,
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			success: false,
			message: "Failed to fetch category.",
		});
	}
};

// Update category
exports.updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { categoryName, description, isActive } = req.body;

		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid category ID.",
			});
		}

		if (categoryName !== undefined) {
			const categoryExist = await Category.findOne({
				_id: { $ne: id },
				categoryName: {
					$regex: `^${categoryName.trim()}$`,
					$options: "i",
				},
			});

			if (categoryExist) {
				return res.status(409).json({
					success: false,
					message: "Category name already exists.",
				});
			}
		}

		const category = await Category.findByIdAndUpdate(
			id,
			{
				$set: { categoryName, description, isActive },
			},
			{
				returnDocument: "after",
				runValidators: true,
			},
		);

		if (!category) {
			return res.status(404).json({
				success: false,
				message: "Category not found.",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Category updated successfully.",
			category,
		});
	} catch (error) {
		console.log(error);

		if (error.name === "ValidationError") {
			return res.status(400).json({
				success: false,
				message: error.message,
			});
		}

		return res.status(500).json({
			success: false,
			message: "Failed to update category.",
		});
	}
};

// Delete category
exports.deleteCategory = async (req, res) => {
	try {
		const { id } = req.params;

		if (!/^[0-9a-fA-F]{24}$/.test(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid category ID.",
			});
		}

		const category = await Category.findById(id);

		if (!category) {
			return res.status(404).json({
				success: false,
				message: "Category not found.",
			});
		}

		const productExist = await Product.findOne({ category: id });

		if (productExist) {
			return res.status(409).json({
				success: false,
				message: "Cannot delete category because products are using it.",
			});
		}

		await Category.findByIdAndDelete(id);

		return res.status(200).json({
			success: true,
			message: "Category deleted successfully.",
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			success: false,
			message: "Failed to delete category.",
		});
	}
};
