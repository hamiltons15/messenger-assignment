const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

test("Missing or malformed JWT secrets fail startup before database access", () => {
  for (const secret of ["", "invalid"]) {
    const result = spawnSync(process.execPath, ["index.js"], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, PORT: "3000", MONGO_URI: "mongodb://127.0.0.1:1/unused", JWT_SECRET: secret },
      encoding: "utf8", timeout: 10000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /JWT_SECRET must be a 64-character hexadecimal secret/);
    assert.equal(result.stdout.includes("Connected to MongoDB"), false);
  }
});
