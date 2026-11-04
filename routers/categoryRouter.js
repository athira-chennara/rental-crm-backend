const express = require("express");

const {
	createCategory,
	getAllCategories,
	getCategoryById,
	updateCategory,
	deleteCategory,
} = require("../controllers/categoryController");

const { tokenVerify, roleVerify } = require("../middlewares/authMiddleware");

const categoryRouter = express.Router();

// Get all categories
categoryRouter.get(
	"/",
	tokenVerify,
	roleVerify("admin", "staff"),
	getAllCategories,
);

// Create category
categoryRouter.post("/", tokenVerify, roleVerify("admin"), createCategory);

// Get category by ID
categoryRouter.get(
	"/:id",
	tokenVerify,
	roleVerify("admin", "staff"),
	getCategoryById,
);

// Update category
categoryRouter.put("/:id", tokenVerify, roleVerify("admin"), updateCategory);

// Delete category
categoryRouter.delete("/:id", tokenVerify, roleVerify("admin"), deleteCategory);

module.exports = categoryRouter;
