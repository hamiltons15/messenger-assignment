function validateMessage(content) {
  if (
    typeof content !== "string" ||
    !content.trim() ||
    content.trim().length > 2000
  ) {
    return "Message content must contain 1 to 2000 characters.";
  }

  return null;
}

module.exports = validateMessage;
