// external modules
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// internal modules
const User = require("../db/models/userSchema");

// login controller
exports.login = async (req, res) => {
	try {
		// collect required data from request
		const { email, password } = req.body;

		// check user exist or not
		const userExist = await User.findOne({
			email: email.toLowerCase().trim(),
		}).select("+password");

		// if user not exist return message
		if (!userExist) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid Email or Password" });
		}

		// check the user is active or not
		if (!userExist.isActive) {
			return res
				.status(400)
				.json({ success: false, message: "Your Account is Inactive" });
		}

		// if user exists , check password is correct or not
		const isPasswordCorrect = await bcrypt.compare(
			password,
			userExist.password,
		);

		// if password doesn't match return message
		if (!isPasswordCorrect) {
			return res
				.status(400)
				.json({ success: false, message: "Invalid Email or Password" });
		}

		// if password matches, create a token
		const newToken = jwt.sign(
			{ id: userExist._id, role: userExist.role },
			process.env.JWT_SECRET,
			{ expiresIn: "1d" },
		);

		return res.status(200).json({
			success: true,
			message: "Login Successfully.",
			user: {
				token: newToken,
				userName: userExist.userName,
				email: userExist.email,
			},
		});
	} catch (error) {
		return res
			.status(500)
			.json({ error: true, message: "Internal Server Error." });
	}
};

// signUp controller
exports.createStaff = async (req, res) => {
	try {
		// collect required data from request
		const { userName, email, password } = req.body;

		// check the user exist or not
		const userExist = await User.findOne({
			email: email.toLowerCase().trim(),
		});

		// if user exist return message
		if (userExist) {
			return res
				.status(400)
				.json({ success: false, message: "User Already Exist." });
		}

		// if user not exist, encrypt the password and create new user
		const encryptedPassword = await bcrypt.hash(password, 10);

		const staff = await User.create({
			userName,
			email: email.toLowerCase().trim(),
			password: encryptedPassword,
		});

		return res.status(201).json({
			success: true,
			message: "Staff account created successfully",
			user: {
				id: staff._id,
				name: staff.name,
				email: staff.email,
				role: staff.role,
			},
		});
	} catch (error) {
		// if duplicate-key errors come
		if (error.code === 11000) {
			return res.status(409).json({
				success: false,
				message: "Email already exists",
			});
		}
		return res
			.status(500)
			.json({ error: true, message: "Internal Server Error." });
	}
};
