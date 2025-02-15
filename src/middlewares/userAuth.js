const jwt = require("jsonwebtoken");
const User = require("../models/user");

const userAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error("No token provided");
        }

        // Extract token
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new Error("Invalid token format");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if(!user) {
            throw new Error( "Unauthorized");
        }

        req.user = user;
        next();
    } catch (err) {
        console.error({
            code: err.code || 'UNKNOWN_ERROR',
            details: err.stack
        });
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
}

module.exports = userAuth;