const test = require("node:test");
const assert = require("node:assert/strict");
const validateInvitees = require("../utils/validateInvitees");
const validateRegistration = require("../utils/validateRegistration");

test("Username invitations accept direct and group participants", () => {
  assert.equal(validateInvitees("direct", [" Bob "]), null);
  assert.equal(validateInvitees("group", ["bob", "carol"]), null);
});

test("Username invitations reject invalid types, counts, names, and normalized duplicates", () => {
  for (const [type, names] of [
    ["public", ["bob"]], ["direct", []], ["direct", ["bob", "carol"]],
    ["group", ["bob"]], ["group", ["Bob", " bob "]],
    ["direct", null], ["direct", [null]], ["direct", ["x"]],
    ["direct", ["bob@example.com"]],
  ]) assert.equal(typeof validateInvitees(type, names), "string");
});

test("Registration enforces username rules and bcrypt UTF-8 password limits", () => {
  assert.equal(validateRegistration(" Alice_1 ", "abcdef"), null);
  assert.equal(validateRegistration("alice", "é".repeat(36)), null);
  for (const [username, password] of [
    ["ab", "abcdef"], ["bad name", "abcdef"], ["alice", "12345"],
    ["alice", "é".repeat(37)], ["alice", null], [null, "abcdef"],
  ]) assert.equal(typeof validateRegistration(username, password), "string");
});
