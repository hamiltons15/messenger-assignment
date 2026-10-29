const test = require("node:test");
const assert = require("node:assert/strict");
const validateConversation = require("../utils/validateConversation");

const alice = "6ae27fc7ab1f7f38bdfab020";
const bob = "6ae280b1ab1f7f38bdfab021";
const carol = "6ae280b1ab1f7f38bdfab022";

test("Valid direct conversation passes validation", () => {
  assert.equal(validateConversation("direct", [alice, bob]), null);
});

test("Valid group conversation passes validation", () => {
  assert.equal(validateConversation("group", [alice, bob, carol]), null);
});

test("Invalid conversation type is rejected", () => {
  assert.equal(
    validateConversation("private", [alice, bob]),
    "Conversation type must be direct or group."
  );
});

test("Empty members array is rejected", () => {
  assert.equal(
    validateConversation("direct", []),
    "Conversation members must be a nonempty array."
  );
});

test("Invalid member ID is rejected", () => {
  assert.equal(
    validateConversation("direct", [alice, "invalid-id"]),
    "Every conversation member must have a valid user ID."
  );
});

test("Direct conversation requires exactly two members", () => {
  assert.equal(
    validateConversation("direct", [alice, bob, carol]),
    "Direct conversations require exactly 2 members."
  );
});

test("Group conversation requires at least three members", () => {
  assert.equal(
    validateConversation("group", [alice, bob]),
    "Group conversations require at least 3 members."
  );
});

test("Duplicate conversation members are rejected", () => {
  assert.equal(
    validateConversation("direct", [alice, alice]),
    "Conversation members must be unique."
  );
});
