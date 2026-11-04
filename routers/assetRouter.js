const express = require("express");

const {
	createAsset,
	getAllAssets,
	getAssetById,
	updateAsset,
	deleteAsset,
} = require("../controllers/assetController");

const { tokenVerify, roleVerify } = require("../middlewares/authMiddleware");

const assetRouter = express.Router();

// View assets
assetRouter.get("/", tokenVerify, roleVerify("admin", "staff"), getAllAssets);

// Create asset
assetRouter.post("/", tokenVerify, roleVerify("admin"), createAsset);

// View asset details
assetRouter.get(
	"/:id",
	tokenVerify,
	roleVerify("admin", "staff"),
	getAssetById,
);

// Update asset
assetRouter.put("/:id", tokenVerify, roleVerify("admin"), updateAsset);

// Delete asset
assetRouter.delete("/:id", tokenVerify, roleVerify("admin"), deleteAsset);

module.exports = assetRouter;
