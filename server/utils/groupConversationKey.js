function groupConversationKey(name, members) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedMembers = Array.from(
    new Set(
      (Array.isArray(members) ? members : [])
        .map((member) => String(member).toLowerCase())
    )
  ).sort();

  return JSON.stringify([normalizedName, normalizedMembers]);
}

module.exports = groupConversationKey;
