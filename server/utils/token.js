const jwt = require("jsonwebtoken");

const TOKEN_EXPIRATION = "1h";

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    { sub: userId.toString() },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRATION }
  );
}

function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: ["HS256"]
  });
}

module.exports = {
  createToken,
  verifyToken
};
