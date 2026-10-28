const test = require("node:test");
const assert = require("node:assert/strict");
const requireAuth = require("../middleware/auth");
const { createToken } = require("../utils/token");

require("dotenv").config();

test("Missing authorization header is rejected", () => {
  const req = {
    headers: {}
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  requireAuth(req, res, next);

  assert.equal(statusCode, 401);
  assert.deepEqual(responseBody, {
    error: "Authentication required."
  });
  assert.equal(nextCalled, false);
});

test("Invalid JWT is rejected", () => {
  const req = {
    headers: {
      authorization: "Bearer invalid.token.value"
    }
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  requireAuth(req, res, next);

  assert.equal(statusCode, 401);
  assert.deepEqual(responseBody, {
    error: "Invalid or expired authentication token."
  });
  assert.equal(nextCalled, false);
});

test("Empty Bearer token is rejected", () => {
  const req = {
    headers: {
      authorization: "Bearer "
    }
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  requireAuth(req, res, next);

  assert.equal(statusCode, 401);
  assert.deepEqual(responseBody, {
    error: "Authentication required."
  });
  assert.equal(nextCalled, false);
});

test("Valid JWT authenticates the user", () => {
  const userId = "6adf761f90c902467dc9fde8";
  const token = createToken(userId);

  const req = {
    headers: {
      authorization: `Bearer ${token}`
    }
  };

  let nextCalled = false;
  let nextError;

  const res = {
    status() {
      throw new Error("Valid authentication should not return an error.");
    }
  };

  const next = (error) => {
    nextCalled = true;
    nextError = error;
  };

  requireAuth(req, res, next);

  assert.equal(req.userId, userId);
  assert.equal(nextCalled, true);
  assert.equal(nextError, undefined);
});


