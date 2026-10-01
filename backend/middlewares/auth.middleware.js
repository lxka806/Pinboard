const JWT = require("jsonwebtoken");

const protect = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Not authorized, no token"
        });
    }

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (e) {
        return res.status(401).json({
            message: "Not authorized, token failed"
        });
    }
};

module.exports = { protect };