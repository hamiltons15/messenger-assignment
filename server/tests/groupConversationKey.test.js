const groupConversationKey = require("../utils/groupConversationKey");

const test = require("node:test");
const assert = require("node:assert/strict");

const alice = "6ae27fc7ab1f7f38bdfab020";
const bob = "6ae280b1ab1f7f38bdfab021";
const carol = "6ae280b1ab1f7f38bdfab022";

test("Group identity ignores member ordering", () => {
  assert.equal(
    groupConversationKey("Project", [alice, bob, carol]),
    groupConversationKey("Project", [carol, alice, bob])
  );
});

test("Different group names are allowed with the same members", () => {
  assert.notEqual(
    groupConversationKey("Project", [alice, bob, carol]),
    groupConversationKey("Family", [alice, bob, carol])
  );
});

test("Group names are normalized by trimming", () => {
  assert.equal(
    groupConversationKey(" Project ", [alice, bob, carol]),
    groupConversationKey("Project", [alice, bob, carol])
  );
});

test("Empty names and undefined names share the same identity", () => {
  assert.equal(
    groupConversationKey(undefined, [alice, bob, carol]),
    groupConversationKey("", [alice, bob, carol])
  );
});
