const mongoose = require("mongoose");

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => {
		console.log("Database Connection Established.");
	})
	.catch((err) => {
		console.log("Error occured while db connection : ", err);
	});

module.exports = mongoose;
