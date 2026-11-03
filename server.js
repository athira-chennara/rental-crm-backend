// external modules
const express = require("express");
const cors = require("cors");
const authRouter = require("./routers/authRouter");
require("dotenv").config();

// internal modules
require("./db/index");

const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/api/auth", authRouter);

app.listen(3000, () => {
	console.log("App is running @http://localhost:3000/");
});
