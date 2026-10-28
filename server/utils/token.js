const jwt = require("jsonwebtoken");

const TOKEN_EXPIRATION = "1h";
const TOKEN_ISSUER = "messenger-api";
const TOKEN_AUDIENCE = "messenger-client";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || !/^[0-9a-f]{64}$/i.test(secret)) {
    throw new Error("JWT_SECRET must be a 64-character hexadecimal secret.");
  }

  return secret;
}

function createToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    getJwtSecret(),
    {
      algorithm: "HS256",
      expiresIn: TOKEN_EXPIRATION,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    }
  );
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret(), {
    algorithms: ["HS256"],
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE
  });
}

module.exports = {
  createToken,
  verifyToken
};
