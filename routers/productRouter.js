const express = require("express");

const {
	createProduct,
	getAllProducts,
	getProductById,
	updateProduct,
	deleteProduct,
} = require("../controllers/productController");

const { tokenVerify, roleVerify } = require("../middlewares/authMiddleware");

const productRouter = express.Router();

// Get all products
productRouter.get(
	"/",
	tokenVerify,
	roleVerify("admin", "staff"),
	getAllProducts,
);

// Create product
productRouter.post("/", tokenVerify, roleVerify("admin"), createProduct);

// Get product by ID
productRouter.get(
	"/:id",
	tokenVerify,
	roleVerify("admin", "staff"),
	getProductById,
);

// Update product
productRouter.put("/:id", tokenVerify, roleVerify("admin"), updateProduct);

// Delete product
productRouter.delete("/:id", tokenVerify, roleVerify("admin"), deleteProduct);

module.exports = productRouter;
