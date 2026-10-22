function validateRegistration(username, password) {
  if (typeof username !== "string" || typeof password !== "string") {
    return "Username and password are required.";
  }

  const normalizedUsername = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
    return "Username must be 3 to 30 characters and contain only letters, numbers, or underscores.";
  }

  if ([...password].length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password must not exceed 72 UTF-8 bytes.";
  }

  return null;
}

module.exports = validateRegistration;
