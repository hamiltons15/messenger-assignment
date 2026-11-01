// Verify current intended source without committing or creating another repository.
const assert = require("node:assert/strict");
const { execFileSync, spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { once } = require("node:events");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const run = `${Date.now()}_${randomBytes(4).toString("hex")}`;
const destination = path.join(root, ".release-check", `source_${run}`);
const cache = path.join(root, ".release-check", "npm-cache");
function command(program, args, cwd = destination) {
  execFileSync(program, args, { cwd, stdio: "inherit" });
}
async function port() {
  const server = net.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const value = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return value;
}
async function ready(url, child) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (child.exitCode !== null) throw new Error("Release process exited during startup.");
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* wait for startup */ }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error("Release process startup timed out.");
}

(async () => {
  const files = [...new Set(execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root }).toString().split("\0").filter(Boolean))];
  for (const file of files) {
    assert.equal(file.startsWith("docs/reference-materials/") || file.split("/").includes("node_modules"), false);
    assert.equal(path.basename(file) === ".env", false);
    const target = path.join(destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, file), target);
  }
  console.log(`Fresh source export: ${path.relative(root, destination)} (${files.length} files)`);
  for (const directory of [destination, path.join(destination, "server"), path.join(destination, "client")]) {
    command("npm", ["ci", "--no-audit", "--no-fund", "--cache", cache], directory);
  }
  for (const script of ["test", "test:integration", "lint", "build"]) command("npm", ["run", script]);
  command("docker", ["compose", "config", "--quiet"]);

  const apiPort = await port();
  const previewPort = await port();
  const database = `messenger_ia06_release_${run}`;
  const children = [];
  function start(args, directory, environment) {
    const child = spawn(process.execPath, args, { cwd: path.join(destination, directory), env: { ...process.env, ...environment }, stdio: ["ignore", "pipe", "pipe"] });
    child.stdout.resume();
    child.stderr.resume();
    children.push(child);
    return child;
  }
  try {
    const backend = start(["index.js"], "server", {
      PORT: String(apiPort), JWT_SECRET: randomBytes(32).toString("hex"),
      MONGO_URI: `mongodb://127.0.0.1:${process.env.MESSENGER_TEST_MONGO_PORT || 27017}/${database}`,
    });
    await ready(`http://127.0.0.1:${apiPort}/health`, backend);
    const preview = start(["node_modules/vite/bin/vite.js", "preview", "--port", String(previewPort)], "client", { MESSENGER_API_PORT: String(apiPort) });
    const origin = `http://127.0.0.1:${previewPort}`;
    await ready(origin, preview);
    assert.match(await (await fetch(origin)).text(), /<div id="root"><\/div>/);
    assert.equal((await fetch(`${origin}/api/auth/me`)).status, 401);
    assert.equal((await fetch(`${origin}/socket.io/?EIO=4&transport=polling`)).status, 200);
    console.log("PASS built-client HTTP, API proxy/authentication, and Socket.IO transport smoke checks");
    console.log(`PASS fresh source install/test/lint/build/start; disposable database ${database} retained.`);
    console.log("This is an uncommitted source export, not proof of a final committed clone or remote submission.");
  } finally {
    for (const child of children.reverse()) {
      if (child.exitCode === null) {
        const exit = once(child, "exit");
        child.kill("SIGTERM");
        await exit;
      }
    }
  }
})().catch(error => {
  console.error("Release verification failed:", error.message);
  process.exitCode = 1;
});
