const mongoose = require("mongoose");

function validateConversation(type, members) {
  if (type !== "direct" && type !== "group") {
    return "Conversation type must be direct or group.";
  }

  if (!Array.isArray(members) || members.length === 0) {
    return "Conversation members must be a nonempty array.";
  }

  if (
    !members.every(member =>
      typeof member === "string" &&
      mongoose.isObjectIdOrHexString(member)
    )
  ) {
    return "Every conversation member must have a valid user ID.";
  }

  if (type === "direct" && members.length !== 2) {
    return "Direct conversations require exactly 2 members.";
  }

  if (type === "group" && members.length < 3) {
    return "Group conversations require at least 3 members.";
  }

  if (new Set(members).size !== members.length) {
    return "Conversation members must be unique.";
  }

  return null;
}

module.exports = validateConversation;
