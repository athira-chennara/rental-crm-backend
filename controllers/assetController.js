const mongoose = require("mongoose");

const Asset = require("../db/models/assetSchema");
const Product = require("../db/models/productSchema");

// Create Asset
exports.createAsset = async (req, res) => {
	try {
		const {
			product,
			assetCode,
			serialNumber,
			condition,
			purchaseDate,
			purchasePrice,
			notes,
		} = req.body;

		// Check product
		const productExist = await Product.findById(product);

		if (!productExist || !productExist.isActive) {
			return res.status(404).json({
				success: false,
				message: "Product not found or inactive",
			});
		}

		// Check duplicate asset code
		const assetExist = await Asset.findOne({ assetCode });

		if (assetExist) {
			return res.status(409).json({
				success: false,
				message: "Asset code already exists",
			});
		}

		const asset = new Asset({
			product,
			assetCode,
			serialNumber,
			condition,
			purchaseDate,
			purchasePrice,
			notes,
		});

		await asset.save();

		return res.status(201).json({
			success: true,
			message: "Asset created successfully",
			asset,
		});
	} catch (error) {
		console.log(error);

		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Get All Assets
exports.getAllAssets = async (req, res) => {
	try {
		const { search = "", page = 1, limit = 10, status, product } = req.query;

		const skip = (Number(page) - 1) * Number(limit);

		const searchQuery = {};

		if (search) {
			searchQuery.$or = [
				{ assetCode: { $regex: search, $options: "i" } },
				{ serialNumber: { $regex: search, $options: "i" } },
			];
		}

		if (status) {
			searchQuery.status = status;
		}

		if (product) {
			searchQuery.product = product;
		}

		const [assets, total] = await Promise.all([
			Asset.find(searchQuery)
				.populate("product")
				.sort({ createdAt: -1 })
				.skip(skip)
				.limit(Number(limit)),

			Asset.countDocuments(searchQuery),
		]);

		return res.status(200).json({
			success: true,
			total,
			currentPage: Number(page),
			totalPages: Math.ceil(total / Number(limit)),
			assets,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Get Asset By ID
exports.getAssetById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid asset ID",
			});
		}

		const asset = await Asset.findById(id).populate(
			"product",
			"productName rentalRate securityDeposi",
		);

		if (!asset) {
			return res.status(404).json({
				success: false,
				message: "Asset not found",
			});
		}

		return res.status(200).json({
			success: true,
			asset,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// Update Asset
exports.updateAsset = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid asset ID",
			});
		}

		const {
			product,
			assetCode,
			serialNumber,
			condition,
			status,
			purchaseDate,
			purchasePrice,
			notes,
		} = req.body;

		const asset = await Asset.findById(id);

		if (!asset) {
			return res.status(404).json({
				success: false,
				message: "Asset not found",
			});
		}

		// Check product if changing
		if (product) {
			const productExist = await Product.findById(product);

			if (!productExist || !productExist.isActive) {
				return res.status(404).json({
					success: false,
					message: "Product not found or inactive",
				});
			}

			asset.product = product;
		}

		// Check duplicate asset code
		if (assetCode && assetCode !== asset.assetCode) {
			const duplicate = await Asset.findOne({
				assetCode,
				_id: { $ne: id },
			});

			if (duplicate) {
				return res.status(409).json({
					success: false,
					message: "Asset code already exists",
				});
			}

			asset.assetCode = assetCode;
		}

		if (serialNumber !== undefined) asset.serialNumber = serialNumber;
		if (condition !== undefined) asset.condition = condition;
		if (status !== undefined) asset.status = status;
		if (purchaseDate !== undefined) asset.purchaseDate = purchaseDate;
		if (purchasePrice !== undefined) asset.purchasePrice = purchasePrice;
		if (notes !== undefined) asset.notes = notes;

		await asset.save();

		return res.status(200).json({
			success: true,
			message: "Asset updated successfully",
			asset,
		});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Delete Asset
exports.deleteAsset = async (req, res) => {
	try {
		const { id } = req.params;

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid asset ID",
			});
		}

		const asset = await Asset.findById(id);

		if (!asset) {
			return res.status(404).json({
				success: false,
				message: "Asset not found",
			});
		}

		if (["reserved", "rented"].includes(asset.status)) {
			return res.status(409).json({
				success: false,
				message: "Cannot delete an asset that is reserved or rented",
			});
		}

		await Asset.findByIdAndDelete(id);

		return res.status(200).json({
			success: true,
			message: "Asset deleted successfully",
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
