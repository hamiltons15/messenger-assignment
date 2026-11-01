function validateInvitees(type, usernames) {
  if (type !== "direct" && type !== "group") {
    return "Conversation type must be direct or group.";
  }
  if (!Array.isArray(usernames) || !usernames.every(
    name => typeof name === "string" && /^[a-z0-9_]{3,30}$/i.test(name.trim())
  )) {
    return "Provide registered usernames containing 3 to 30 letters, numbers, or underscores.";
  }
  if (type === "direct" && usernames.length !== 1) {
    return "Enter exactly one other username for a direct conversation.";
  }
  if (type === "group" && usernames.length < 2) {
    return "Enter at least two other usernames for a group.";
  }
  if (new Set(usernames.map(name => name.trim().toLowerCase())).size !== usernames.length) {
    return "Conversation usernames must be unique.";
  }
  return null;
}

module.exports = validateInvitees;
