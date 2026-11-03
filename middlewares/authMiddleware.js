// external modules
const jwt = require("jsonwebtoken");

// internal modeules
const User = require("../db/models/userSchema");

// token vrifying middleware
exports.tokenVerify = async (req, res, next) => {
	try {
		// collect token from request
		const { authorization } = req.headers;

		// if no authorization
		if (!authorization || !authorization.startsWith("Bearer ")) {
			return res
				.status(401)
				.json({ error: true, message: "Authentication token is required." });
		}

		// decode token from autherization data
		const token = authorization.split(" ")[1];

		// verify the token is valid or not
		const tokenValid = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(tokenValid.id);

		// if the user not active
		if (!user || !user.isActive) {
			return res
				.status(401)
				.json({ error: true, message: "You are not autherized." });
		}

		req.user = { id: user.id, role: user.role };
		next();
	} catch (error) {
		if (
			error.name === "JsonWebTokenError" ||
			error.name === "TokenExpiredError" ||
			error.name === "NotBeforeError"
		) {
			return res.status(401).json({
				success: false,
				message:
					error.name === "TokenExpiredError"
						? "Token expired. Please login again."
						: "Invalid or expired authentication token.",
			});
		}
		return res
			.status(500)
			.json({ error: true, message: "Internal Server Error." });
	}
};

// role checking middleware
exports.roleVerify = (...allowedRoles) => {
	return (req, res, next) => {
		try {
			// Check whether user exists in request
			if (!req.user) {
				return res.status(401).json({
					success: false,
					message: "Authentication required.",
				});
			}

			// Check whether user's role is allowed
			if (!allowedRoles.includes(req.user.role)) {
				return res.status(403).json({
					success: false,
					message: "You don't have permission to access this resource.",
				});
			}

			// Allow access
			next();
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: "Internal Server Error.",
			});
		}
	};
};
