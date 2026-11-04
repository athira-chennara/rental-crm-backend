// external modules
const express = require("express");
const cors = require("cors");
const authRouter = require("./routers/authRouter");
const customerRouter = require("./routers/customerRouter");
const userRouter = require("./routers/userRouter");
const productRouter = require("./routers/productRouter");
const categoryRouter = require("./routers/categoryRouter");
const assetRouter = require("./routers/assetRouter");
require("dotenv").config();

// internal modules
require("./db/index");

const app = express();

// middlewares
app.use(express.json());
app.use(cors());

// routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/assets", assetRouter);
app.use("/api/products", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/customers", customerRouter);

app.listen(3000, () => {
	console.log("App is running @http://localhost:3000/");
});
