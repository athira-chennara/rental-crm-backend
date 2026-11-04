// external modules
const express = require("express");

// internal modules
const {
	getAllUsers,
	getUserById,
	updateUser,
	changePassword,
	deactivateUser,
	deleteUser,
} = require("../controllers/userController");
const { tokenVerify, roleVerify } = require("../middlewares/authMiddleware");

const userRouter = express.Router();

userRouter.get("/", tokenVerify, roleVerify("admin", "staff"), getAllUsers);

userRouter.get("/:id", tokenVerify, roleVerify("admin"), getUserById);

userRouter.put("/:id", tokenVerify, roleVerify("admin"), updateUser);

userRouter.patch(
	"/change-password",
	tokenVerify,
	roleVerify("admin", "staff"),
	changePassword,
);
userRouter.patch(
	"/:id/deactivate",
	tokenVerify,
	roleVerify("admin"),
	deactivateUser,
);

userRouter.delete("/:id", tokenVerify, roleVerify("admin"), deleteUser);

module.exports = userRouter;
