// external modules
const express = require("express");

// internal modules
const {
	getAllCustomers,
	createCustomer,
	getCustomerById,
	updateCustomer,
	deleteCustomer,
} = require("../controllers/customerController");
const { roleVerify, tokenVerify } = require("../middlewares/authMiddleware");

const customerRouter = express.Router();

customerRouter.get(
	"/",
	tokenVerify,
	roleVerify("admin", "staff"),
	getAllCustomers,
);
customerRouter.get(
	"/:id",
	tokenVerify,
	roleVerify("admin", "staff"),
	getCustomerById,
);

customerRouter.post(
	"/",
	tokenVerify,
	roleVerify("admin", "staff"),
	createCustomer,
);

customerRouter.put(
	"/:id",
	tokenVerify,
	roleVerify("admin", "staff"),
	updateCustomer,
);

customerRouter.delete("/:id", tokenVerify, roleVerify("admin"), deleteCustomer);

module.exports = customerRouter;
