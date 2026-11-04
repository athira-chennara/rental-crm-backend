const express = require("express");

const {
	createRental,
	getAllRentals,
	getRentalById,
	dispatchRental,
	returnRental,
	cancelRental,
} = require("../controllers/rentalController");

const { tokenVerify, roleVerify } = require("../middlewares/authMiddleware");

const rentalRouter = express.Router();

// View rentals
rentalRouter.get("/", tokenVerify, roleVerify("admin", "staff"), getAllRentals);

// Create reservation
rentalRouter.post("/", tokenVerify, roleVerify("admin", "staff"), createRental);

// View rental details
rentalRouter.get(
	"/:id",
	tokenVerify,
	roleVerify("admin", "staff"),
	getRentalById,
);

// Dispatch rental
rentalRouter.patch(
	"/:id/dispatch",
	tokenVerify,
	roleVerify("admin", "staff"),
	dispatchRental,
);

// Return rental
rentalRouter.patch(
	"/:id/return",
	tokenVerify,
	roleVerify("admin", "staff"),
	returnRental,
);

// Cancel reservation
rentalRouter.patch(
	"/:id/cancel",
	tokenVerify,
	roleVerify("admin", "staff"),
	cancelRental,
);

module.exports = rentalRouter;
