const test = require("node:test");
const assert = require("node:assert/strict");
const { createToken, verifyToken } = require("../utils/token");
const jwt = require("jsonwebtoken");

require("dotenv").config();

test("Valid JWT contains the correct user ID", () => {
  const userId = "6adf761f90c902467dc9fde8";

  const token = createToken(userId);
  const decoded = verifyToken(token);

  assert.equal(decoded.sub, userId);
});

test("Tampered JWT is rejected", () => {
  const userId = "6adf761f90c902467dc9fde8";

  const token = createToken(userId);
  const parts = token.split(".");

  // Change the signature without changing the payload.
  const signature = parts[2];
  parts[2] = (signature[0] === "A" ? "B" : "A") + signature.slice(1);

  const tamperedToken = parts.join(".");

  assert.throws(() => {
    verifyToken(tamperedToken);
  }, { name: "JsonWebTokenError" });
});

test("Expired JWT is rejected", () => {
  const userId = "6adf761f90c902467dc9fde8";

  const expiredToken = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: -1,
      issuer: "messenger-api",
      audience: "messenger-client"
    }
  );

  assert.throws(() => {
    verifyToken(expiredToken);
  }, { name: "TokenExpiredError" });
});

test("JWT with incorrect audience is rejected", () => {
  const userId = "6adf761f90c902467dc9fde8";

  const token = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: "messenger-api",
      audience: "incorrect-client"
    }
  );

  assert.throws(() => {
    verifyToken(token);
  }, { name: "JsonWebTokenError" });
});

test("JWT with incorrect issuer is rejected", () => {
  const userId = "6adf761f90c902467dc9fde8";

  const token = jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h",
      issuer: "incorrect-issuer",
      audience: "messenger-client"
    }
  );

  assert.throws(() => {
    verifyToken(token);
  }, { name: "JsonWebTokenError" });
});




