const test = require("node:test");
const assert = require("node:assert/strict");
const validateMessage = require("../utils/validateMessage");

test("Valid message content passes validation", () => {
  assert.equal(validateMessage("Hello, Bob!"), null);
});

test("Message with exactly 2000 characters is accepted", () => {
  assert.equal(validateMessage("a".repeat(2000)), null);
});

test("Empty message content is rejected", () => {
  assert.equal(
    validateMessage(""),
    "Message content must contain 1 to 2000 characters."
  );
});

test("Whitespace-only message content is rejected", () => {
  assert.equal(
    validateMessage("   "),
    "Message content must contain 1 to 2000 characters."
  );
});

test("Message exceeding 2000 characters is rejected", () => {
  assert.equal(
    validateMessage("a".repeat(2001)),
    "Message content must contain 1 to 2000 characters."
  );
});

test("Non-string message content is rejected", () => {
  assert.equal(
    validateMessage(123),
    "Message content must contain 1 to 2000 characters."
  );
});

test("Missing message content is rejected", () => {
  assert.equal(
    validateMessage(undefined),
    "Message content must contain 1 to 2000 characters."
  );
});

test("Message with surrounding whitespace is accepted", () => {
  assert.equal(validateMessage("  Hello, Bob!  "), null);
});
