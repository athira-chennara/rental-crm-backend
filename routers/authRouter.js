// external modules
const express = require("express");

// internal modules
const { login, createStaff } = require("../controllers/authController");

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/create-staff", createStaff);

module.exports = authRouter;
