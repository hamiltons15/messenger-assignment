const mongoose = require("mongoose");
const { verifyToken } = require("../utils/token");

function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required."
    });
  }

  const token = authorization.slice(7);

  if (!token) {
    return res.status(401).json({
      error: "Authentication required."
    });
  }

  try {
    const decoded = verifyToken(token);

    if (
      typeof decoded.sub !== "string" ||
      !mongoose.isObjectIdOrHexString(decoded.sub)
    ) {
      return res.status(401).json({
        error: "Invalid authentication token."
      });
    }

    req.userId = decoded.sub;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        error: "Invalid or expired authentication token."
      });
    }

    next(error);
  }
}

module.exports = requireAuth;
