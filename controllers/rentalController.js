const mongoose = require("mongoose");

const Rental = require("../db/models/rentalSchema");
const Customer = require("../db/models/customerSchema");
const Asset = require("../db/models/assetSchema");

// validate MongoDB ID
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// release assets if reservation creation fails
const releaseAssets = async (assetIds) => {
	await Asset.updateMany(
		{ _id: { $in: assetIds }, status: "reserved" },
		{ $set: { status: "available" } },
	);
};

// Reserve the selected assets
exports.createRental = async (req, res) => {
	let reservedIds = [];

	try {
		const { customer, assets, startDate, expectedReturnDate } = req.body;

		// Validate customer ID
		if (!customer || !isValidId(customer)) {
			return res.status(400).json({
				success: false,
				message: "Invalid customer ID",
			});
		}

		// Check customer
		const customerExist = await Customer.findById(customer);

		if (!customerExist) {
			return res.status(404).json({
				success: false,
				message: "Customer not found",
			});
		}

		// Validate dates
		const start = new Date(startDate);
		const end = new Date(expectedReturnDate);

		if (
			!startDate ||
			!expectedReturnDate ||
			isNaN(start.getTime()) ||
			isNaN(end.getTime()) ||
			end <= start
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid rental dates",
			});
		}

		// Validate assets
		if (!Array.isArray(assets) || assets.length === 0) {
			return res.status(400).json({
				success: false,
				message: "Select at least one asset",
			});
		}

		const assetIds = assets.map((item) => item.asset);

		if (
			assetIds.some((id) => !id || !isValidId(id)) ||
			new Set(assetIds.map(String)).size !== assetIds.length
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid or duplicate assets",
			});
		}

		// Get asset and product details
		const assetDetails = await Asset.find({
			_id: { $in: assetIds },
		}).populate("product");

		if (assetDetails.length !== assetIds.length) {
			return res.status(404).json({
				success: false,
				message: "One or more assets not found",
			});
		}

		// Calculate rental duration
		const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

		let rentalAmount = 0;
		let securityDeposit = 0;
		const rentalAssets = [];

		// Validate products and calculate charges
		for (const asset of assetDetails) {
			if (!asset.product || !asset.product.isActive) {
				return res.status(400).json({
					success: false,
					message: `Product for ${asset.assetCode} is inactive`,
				});
			}

			rentalAssets.push({
				asset: asset._id,
				rentalRate: asset.product.rentalRate,
			});

			rentalAmount += asset.product.rentalRate * duration;
			securityDeposit += asset.product.securityDeposit;
		}

		// Reserve assets atomically, one by one
		for (const id of assetIds) {
			const reservedAsset = await Asset.findOneAndUpdate(
				{ _id: id, status: "available" },
				{ $set: { status: "reserved" } },
				{ new: true },
			);

			if (!reservedAsset) {
				await releaseAssets(reservedIds);

				return res.status(409).json({
					success: false,
					message: "One or more assets are no longer available",
				});
			}

			reservedIds.push(reservedAsset._id);
		}

		// Generate rental number
		const rentalNumber = `RNT-${Date.now()}`;

		// Create rental
		const rental = await Rental.create({
			rentalNumber,
			customer,
			assets: rentalAssets,
			startDate: start,
			expectedReturnDate: end,
			rentalAmount,
			securityDeposit,
			totalAmount: rentalAmount + securityDeposit,
			createdBy: req.user.id,
		});

		res.status(201).json({
			success: true,
			message: "Rental created successfully",
			rental,
		});
	} catch (error) {
		// Release reserved assets if creation fails
		if (reservedIds.length) {
			await releaseAssets(reservedIds);
		}

		console.log(error);

		res.status(500).json({
			success: false,
			message: "Failed to create rental",
		});
	}
};

// Search, filter and pagination
exports.getAllRentals = async (req, res) => {
	try {
		const { search = "", status, page = 1, limit = 10 } = req.query;

		const currentPage = Math.max(1, Number(page) || 1);
		const perPage = Math.max(1, Math.min(100, Number(limit) || 10));

		const query = {};

		// Filter by customer
		if (req.query.customer) {
			if (!mongoose.Types.ObjectId.isValid(req.query.customer)) {
				return res.status(400).json({
					success: false,
					message: "Invalid customer ID",
				});
			}

			query.customer = req.query.customer;
		}

		// Search by rental number or customer name
		if (search.trim()) {
			const customers = await Customer.find({
				customerName: { $regex: search.trim(), $options: "i" },
			}).select("_id");

			query.$or = [
				{
					rentalNumber: {
						$regex: search.trim(),
						$options: "i",
					},
				},
				{
					customer: {
						$in: customers.map((item) => item._id),
					},
				},
			];
		}

		// Filter by status
		if (status) {
			query.status = status;
		}

		const rentals = await Rental.find(query)
			.populate("customer", "customerName phone")
			.populate("assets.asset", "assetCode serialNumber")
			.populate("createdBy", "userName")
			.sort({ createdAt: -1 })
			.skip((currentPage - 1) * perPage)
			.limit(perPage);

		const total = await Rental.countDocuments(query);

		res.status(200).json({
			success: true,
			rentals,
			total,
			currentPage,
			totalPages: Math.ceil(total / perPage),
		});
	} catch (error) {
		console.log(error);

		res.status(500).json({
			success: false,
			message: "Failed to fetch rentals",
		});
	}
};

// 3. GET RENTAL BY ID
exports.getRentalById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidId(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid rental ID",
			});
		}

		const rental = await Rental.findById(id)
			.populate("customer")
			.populate("assets.asset")
			.populate("createdBy", "userName");

		if (!rental) {
			return res.status(404).json({
				success: false,
				message: "Rental not found",
			});
		}

		res.status(200).json({
			success: true,
			rental,
		});
	} catch (error) {
		console.log(error);

		res.status(500).json({
			success: false,
			message: "Failed to fetch rental",
		});
	}
};

// Change reserved assets to rented
exports.dispatchRental = async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidId(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid rental ID",
			});
		}

		const rental = await Rental.findById(id);

		if (!rental) {
			return res.status(404).json({
				success: false,
				message: "Rental not found",
			});
		}

		if (rental.status !== "reserved") {
			return res.status(400).json({
				success: false,
				message: "Only reserved rentals can be dispatched",
			});
		}

		const assetIds = rental.assets.map((item) => item.asset);

		// Check that every asset is still reserved
		const updatedIds = [];

		for (const assetId of assetIds) {
			const asset = await Asset.findOneAndUpdate(
				{ _id: assetId, status: "reserved" },
				{ $set: { status: "rented" } },
				{ new: true },
			);

			if (!asset) {
				// Restore already updated assets
				await Asset.updateMany(
					{ _id: { $in: updatedIds }, status: "rented" },
					{ $set: { status: "reserved" } },
				);

				return res.status(409).json({
					success: false,
					message: "Unable to dispatch. Check asset availability",
				});
			}

			updatedIds.push(asset._id);
		}

		rental.status = "active";
		await rental.save();

		res.status(200).json({
			success: true,
			message: "Rental dispatched successfully",
			rental,
		});
	} catch (error) {
		console.log(error);

		res.status(500).json({
			success: false,
			message: "Failed to dispatch rental",
		});
	}
};

// Inspect assets and complete rental
exports.returnRental = async (req, res) => {
	try {
		const { id } = req.params;
		const { assetInspections, lateFee = 0, damageCharge = 0 } = req.body;

		if (!isValidId(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid rental ID",
			});
		}

		const rental = await Rental.findById(id);

		if (!rental) {
			return res.status(404).json({
				success: false,
				message: "Rental not found",
			});
		}

		if (rental.status !== "active") {
			return res.status(400).json({
				success: false,
				message: "Only active rentals can be returned",
			});
		}

		// Validate charges
		if (
			typeof lateFee !== "number" ||
			typeof damageCharge !== "number" ||
			lateFee < 0 ||
			damageCharge < 0 ||
			!Number.isFinite(lateFee) ||
			!Number.isFinite(damageCharge)
		) {
			return res.status(400).json({
				success: false,
				message: "Invalid late fee or damage charge",
			});
		}

		// Validate inspection details
		if (
			!Array.isArray(assetInspections) ||
			assetInspections.length !== rental.assets.length
		) {
			return res.status(400).json({
				success: false,
				message: "Provide an inspection for every rented asset",
			});
		}

		const allowedConditions = ["excellent", "good", "fair", "damaged"];

		const inspectionMap = new Map();

		for (const inspection of assetInspections) {
			if (
				!inspection.assetId ||
				!isValidId(inspection.assetId) ||
				!allowedConditions.includes(inspection.condition)
			) {
				return res.status(400).json({
					success: false,
					message: "Invalid asset inspection details",
				});
			}

			const key = String(inspection.assetId);

			if (inspectionMap.has(key)) {
				return res.status(400).json({
					success: false,
					message: "Duplicate asset inspection",
				});
			}

			inspectionMap.set(key, inspection.condition);
		}

		const rentalAssetIds = rental.assets.map((item) => String(item.asset));

		if (rentalAssetIds.some((assetId) => !inspectionMap.has(assetId))) {
			return res.status(400).json({
				success: false,
				message: "Inspection details do not match rental assets",
			});
		}

		// Check all assets are currently rented
		const rentedAssets = await Asset.find({
			_id: { $in: rentalAssetIds },
			status: "rented",
		});

		if (rentedAssets.length !== rentalAssetIds.length) {
			return res.status(409).json({
				success: false,
				message: "One or more assets are not currently rented",
			});
		}

		// Update each asset after inspection
		for (const assetId of rentalAssetIds) {
			const condition = inspectionMap.get(assetId);

			await Asset.findOneAndUpdate(
				{ _id: assetId, status: "rented" },
				{
					$set: {
						condition,
						status: condition === "damaged" ? "maintenance" : "available",
					},
				},
				{ new: true },
			);
		}

		// Complete rental
		rental.actualReturnDate = new Date();
		rental.lateFee = lateFee;
		rental.damageCharge = damageCharge;
		rental.totalAmount =
			rental.rentalAmount + rental.securityDeposit + lateFee + damageCharge;
		rental.status = "completed";

		await rental.save();

		res.status(200).json({
			success: true,
			message: "Rental returned successfully",
			rental,
		});
	} catch (error) {
		console.log(error);

		res.status(500).json({
			success: false,
			message: "Failed to return rental",
		});
	}
};

// Release reserved assets
exports.cancelRental = async (req, res) => {
	try {
		const { id } = req.params;

		if (!isValidId(id)) {
			return res.status(400).json({
				success: false,
				message: "Invalid rental ID",
			});
		}

		const rental = await Rental.findById(id);

		if (!rental) {
			return res.status(404).json({
				success: false,
				message: "Rental not found",
			});
		}

		if (rental.status !== "reserved") {
			return res.status(400).json({
				success: false,
				message: "Only reserved rentals can be cancelled",
			});
		}

		const assetIds = rental.assets.map((item) => item.asset);

		// Release assets
		const result = await Asset.updateMany(
			{ _id: { $in: assetIds }, status: "reserved" },
			{ $set: { status: "available" } },
		);

		if (result.modifiedCount !== assetIds.length) {
			return res.status(409).json({
				success: false,
				message: "Unable to release all reserved assets",
			});
		}

		rental.status = "cancelled";
		await rental.save();

		res.status(200).json({
			success: true,
			message: "Rental cancelled successfully",
			rental,
		});
	} catch (error) {
		console.log(error);

		res.status(500).json({
			success: false,
			message: "Failed to cancel rental",
		});
	}
};
