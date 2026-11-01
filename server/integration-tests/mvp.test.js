const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { once } = require("node:events");
const net = require("node:net");
const path = require("node:path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { io } = require("socket.io-client");

// Always allocate a NEW database. Never load .env or reuse development fixtures.
// Documents are retained for inspection; this suite never drops/deletes data.
test("Isolated Messenger API and Socket.IO verification", { timeout: 120000 }, async t => {
  const database = `messenger_ia06_test_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const mongoPort = process.env.MESSENGER_TEST_MONGO_PORT || "27017";
  assert.match(mongoPort, /^\d{1,5}$/);
  const uri = `mongodb://127.0.0.1:${mongoPort}/${database}`;
  const key = randomBytes(32).toString("hex");
  const listener = net.createServer();
  listener.listen(0, "127.0.0.1");
  await once(listener, "listening");
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  let child;
  const sockets = [];
  let db;

  async function start() {
    child = spawn(process.execPath, ["index.js"], {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, PORT: String(port), MONGO_URI: uri, JWT_SECRET: key, NODE_ENV: "test" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    // Keep process pipes drained; never print tokens or connection configuration.
    child.stdout.resume();
    child.stderr.resume();
    for (let attempt = 0; attempt < 200; attempt++) {
      if (child.exitCode !== null) throw new Error("Isolated backend exited during startup.");
      try {
        if ((await fetch(`${base}/health`)).ok) return;
      } catch { /* wait for isolated process */ }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error("Isolated backend did not become ready.");
  }
  async function stop() {
    if (child && child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
  }
  async function request(route, { token, method = "GET", body } = {}) {
    const response = await fetch(`${base}${route}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  }
  async function connect(token) {
    const socket = io(base, { auth: { token }, reconnection: false, autoConnect: false, timeout: 3000 });
    sockets.push(socket);
    const ready = new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
    });
    socket.connect();
    await ready;
    return socket;
  }
  const sign = (id, expiresIn = "1h") => jwt.sign({ sub: id }, key, {
    algorithm: "HS256", issuer: "messenger-api", audience: "messenger-client", expiresIn,
  });
  const password = randomBytes(18).toString("hex");
  const accounts = {};
  let direct;
  let group;
  let saved;
  try {
    await start();
    console.log(`Disposable database: ${database} (retained; no development fixtures used)`);

    await t.test("Registration, unique names, validation, bcrypt storage, and login", async () => {
      for (const username of ["alice", "bob", "carol", "dave"]) {
        const registered = await request("/api/auth/register", { method: "POST", body: { username, password } });
        assert.equal(registered.status, 201);
        const login = await request("/api/auth/login", { method: "POST", body: { username, password } });
        assert.equal(login.status, 200);
        accounts[username] = login.body;
        assert.equal((await request("/api/auth/me", { token: login.body.token })).body.user.username, username);
        assert.equal("passwordHash" in login.body.user, false);
      }
      assert.equal((await request("/api/auth/register", { method: "POST", body: { username: "ALICE", password } })).status, 409);
      for (const body of [{}, { username: "a", password }, { username: "valid", password: "12345" }]) {
        assert.equal((await request("/api/auth/register", { method: "POST", body })).status, 400);
      }
      for (const body of [{ username: "alice", password: "wrong" }, { username: "unknown", password }]) {
        assert.equal((await request("/api/auth/login", { method: "POST", body })).status, 401);
      }
      assert.equal((await request("/api/auth/login", { method: "POST", body: {} })).status, 400);
      db = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 3000 }).asPromise();
      const stored = await db.collection("users").findOne({ username: "alice" });
      assert.match(stored.passwordHash, /^\$2[aby]\$/);
      assert.equal(await require("bcrypt").compare(password, stored.passwordHash), true);
      assert.equal("password" in stored, false);
    });

    await t.test("Protected HTTP operations reject missing, invalid, and expired JWTs", async () => {
      for (const token of [undefined, "invalid.token.value", sign(accounts.alice.user.id, -1)]) {
        for (const route of ["/api/auth/me", "/api/conversations"]) {
          assert.equal((await request(route, { token })).status, 401);
        }
      }
    });

    await t.test("Create direct/group conversations by username, including creator and friendly participants", async () => {
      const token = accounts.alice.token;
      const created = await request("/api/conversations", { token, method: "POST", body: { type: "direct", usernames: [" BOB "] } });
      assert.equal(created.status, 201);
      direct = created.body.conversation.id;
      const createdGroup = await request("/api/conversations", { token, method: "POST", body: { type: "group", usernames: ["bob", "carol"], name: "MVP group" } });
      assert.equal(createdGroup.status, 201);
      group = createdGroup.body.conversation.id;
      const listing = await request("/api/conversations", { token });
      const entry = listing.body.conversations.find(c => c.id === group);
      assert.equal(entry.name, "MVP group");
      assert.deepEqual(entry.participants.map(p => p.username).sort(), ["alice", "bob", "carol"]);
      assert.equal(entry.participants.some(p => "passwordHash" in p), false);
      for (const body of [
        { type: "direct", usernames: ["unknown"] },
        { type: "direct", usernames: ["alice"] },
        { type: "group", usernames: ["bob", "BOB"] },
        { type: "group", usernames: ["bob"] },
        { type: "direct", usernames: ["bob"], members: [accounts.alice.user.id, accounts.bob.user.id] },
      ]) assert.equal((await request("/api/conversations", { token, method: "POST", body })).status, 400);
    });

    await t.test("Legacy member-ID input remains supported and enforces creator membership", async () => {
      const members = [accounts.alice.user.id, accounts.dave.user.id];
      assert.equal((await request("/api/conversations", { token: accounts.alice.token, method: "POST", body: { type: "direct", members } })).status, 201);
      assert.equal((await request("/api/conversations", { token: accounts.carol.token, method: "POST", body: { type: "direct", members } })).status, 403);
    });

    await t.test("Direct duplicates return 409; concurrent creation saves only one conversation", async () => {
      const duplicate = await request("/api/conversations", { token: accounts.bob.token, method: "POST", body: { type: "direct", usernames: ["alice"] } });
      assert.equal(duplicate.status, 409);
      assert.equal(duplicate.body.conversation.id, direct);
      const results = await Promise.all([1, 2].map(() => request("/api/conversations", {
        token: accounts.bob.token, method: "POST", body: { type: "direct", usernames: ["dave"] },
      })));
      assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
      assert.equal(await db.collection("conversations").countDocuments({
        directKey: [accounts.bob.user.id, accounts.dave.user.id].sort().join(":"),
      }), 1);
    });

    await t.test("HTTP message validation, server sender identity, and direct/group outsider denial", async () => {
      for (const id of [direct, group]) {
        for (const method of ["GET", "POST"]) {
          assert.equal((await request(`/api/conversations/${id}/messages`, {
            token: accounts.dave.token, method, ...(method === "POST" ? { body: { content: "unauthorized" } } : {}),
          })).status, 404);
        }
      }
      for (const content of ["", " ", "a".repeat(2001), 42, null]) {
        assert.equal((await request(`/api/conversations/${direct}/messages`, { token: accounts.alice.token, method: "POST", body: { content } })).status, 400);
      }
      const result = await request(`/api/conversations/${direct}/messages`, {
        token: accounts.alice.token, method: "POST", body: { content: "Persistent message", sender: accounts.bob.user.id },
      });
      assert.equal(result.status, 201);
      saved = result.body.message;
      assert.equal(saved.sender, accounts.alice.user.id);
      assert.equal(saved.conversation, direct);
      assert.equal((await request("/api/conversations", { token: accounts.dave.token })).body.conversations.some(c => c.id === group || c.id === direct), false);
    });

    await t.test("Every group member can contribute and retrieve group history", async () => {
      for (const name of ["alice", "bob", "carol"]) {
        assert.equal((await request(`/api/conversations/${group}/messages`, { token: accounts[name].token, method: "POST", body: { content: `Group from ${name}` } })).status, 201);
      }
      for (const name of ["alice", "bob", "carol"]) {
        assert.equal((await request(`/api/conversations/${group}/messages`, { token: accounts[name].token })).body.messages.length, 3);
      }
    });

    await t.test("History persists across backend restart and recipient reauthentication", async () => {
      await stop();
      await start();
      const login = await request("/api/auth/login", { method: "POST", body: { username: "bob", password } });
      const history = await request(`/api/conversations/${direct}/messages`, { token: login.body.token });
      assert.equal(history.status, 200);
      assert.equal(history.body.messages.some(message => message.id === saved.id && message.content === saved.content), true);
    });

    await t.test("Pagination has deterministic equal-time ordering, no duplicates, and scoped cursors", async () => {
      const stamp = new Date("2026-01-01T00:00:00Z");
      const messages = Array.from({ length: 8 }, (_, index) => ({
        _id: new mongoose.Types.ObjectId(), conversation: new mongoose.Types.ObjectId(direct),
        sender: new mongoose.Types.ObjectId(accounts.alice.user.id), content: `Tie ${index}`,
        createdAt: stamp, updatedAt: stamp,
      }));
      await db.collection("messages").insertMany(messages);
      const loaded = [];
      const cursors = new Set();
      let cursor;
      do {
        const result = await request(`/api/conversations/${direct}/messages${cursor ? `?before=${cursor}` : ""}`, { token: accounts.bob.token });
        assert.equal(result.status, 200);
        loaded.push(...result.body.messages);
        cursor = result.body.nextCursor;
        if (cursor) { assert.equal(cursors.has(cursor), false); cursors.add(cursor); }
      } while (cursor);
      assert.equal(new Set(loaded.map(m => m.id)).size, loaded.length);
      const tied = loaded.filter(m => m.content.startsWith("Tie ")).map(m => m.id);
      assert.deepEqual(tied, messages.map(m => m._id.toString()).sort().reverse());
      for (const before of ["invalid", saved.id]) {
        assert.equal((await request(`/api/conversations/${group}/messages?before=${before}`, { token: accounts.alice.token })).status, 400);
      }
    });

    await t.test("Existing edit/soft-delete APIs enforce sender ownership and preserve history", async () => {
      const route = `/api/conversations/${direct}/messages/${saved.id}`;
      for (const method of ["PATCH", "DELETE"]) {
        assert.equal((await request(route, { token: accounts.bob.token, method, body: { content: "forged" } })).status, 404);
      }
      assert.equal((await request(route, { token: accounts.alice.token, method: "PATCH", body: { content: " " } })).status, 400);
      assert.equal((await request(route, { token: accounts.alice.token, method: "PATCH", body: { content: "Edited" } })).status, 200);
      assert.equal((await request(route, { token: accounts.alice.token, method: "DELETE" })).status, 200);
      const document = await db.collection("messages").findOne({ _id: new mongoose.Types.ObjectId(saved.id) });
      assert.ok(document.deletedAt);
      assert.ok(document.editedAt);
      assert.equal(document.content, "This message was deleted.");
      assert.equal((await request(route, { token: accounts.alice.token, method: "PATCH", body: { content: "Restore" } })).status, 404);
    });

    await t.test("Membership APIs remain creator-only and removal revokes live and HTTP access", async () => {
      const memberRoute = `/api/conversations/${group}/members`;
      const daveId = accounts.dave.user.id;
      assert.equal((await request(memberRoute, { token: accounts.bob.token, method: "POST", body: { userId: daveId } })).status, 403);
      assert.equal((await request(memberRoute, { token: accounts.alice.token, method: "POST", body: { userId: daveId } })).status, 200);
      assert.equal((await request(memberRoute, { token: accounts.alice.token, method: "POST", body: { userId: daveId } })).status, 409);
      const dave = await connect(accounts.dave.token);
      assert.equal((await dave.timeout(3000).emitWithAck("conversation:join", group)).ok, true);
      const received = [];
      dave.on("message:new", message => received.push(message));
      assert.equal((await request(`${memberRoute}/${daveId}`, { token: accounts.alice.token, method: "DELETE" })).status, 200);
      assert.equal((await dave.timeout(3000).emitWithAck("conversation:join", group)).ok, false);
      assert.equal((await dave.timeout(3000).emitWithAck("message:send", { conversationId: group, content: "Removed" })).ok, false);
      assert.equal((await request(`/api/conversations/${group}/messages`, { token: accounts.dave.token })).status, 404);
      assert.equal((await request(`/api/conversations/${group}/messages`, { token: accounts.alice.token, method: "POST", body: { content: "After removal" } })).status, 201);
      await new Promise(resolve => setTimeout(resolve, 150));
      assert.equal(received.length, 0);
      assert.equal((await request(`${memberRoute}/${accounts.alice.user.id}`, { token: accounts.alice.token, method: "DELETE" })).status, 403);
      assert.equal((await request(`${memberRoute}/${accounts.bob.user.id}`, { token: accounts.alice.token, method: "DELETE" })).status, 409);
    });

    await t.test("Parser failures and unknown routes return safe JSON errors", async () => {
      const malformed = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
      assert.equal(malformed.status, 400);
      assert.deepEqual(await malformed.json(), { error: "Invalid JSON request." });
      assert.equal((await request("/api/no-such-route")).status, 404);
    });

    await t.test("Connected sockets are disconnected when their JWT expires", async () => {
      const socket = await connect(sign(accounts.bob.user.id, 2));
      const disconnected = once(socket, "disconnect", { signal: AbortSignal.timeout(4000) });
      assert.equal((await disconnected)[0], "io server disconnect");
      assert.equal(socket.connected, false);
    });

    await t.test("History snapshot before subscription can miss a message; post-join history recovers it", async () => {
      const snapshot = await request(`/api/conversations/${direct}/messages`, { token: accounts.bob.token });
      const bob = await connect(accounts.bob.token);
      const received = [];
      bob.on("message:new", message => received.push(message));
      const gap = await request(`/api/conversations/${direct}/messages`, {
        token: accounts.alice.token, method: "POST", body: { content: "Between snapshot and subscription" },
      });
      assert.equal(snapshot.body.messages.some(m => m.id === gap.body.message.id), false);
      assert.equal((await bob.timeout(3000).emitWithAck("conversation:join", direct)).ok, true);
      const afterJoin = await request(`/api/conversations/${direct}/messages`, { token: accounts.bob.token });
      assert.equal(received.some(m => m.id === gap.body.message.id), false);
      assert.equal(afterJoin.body.messages.some(m => m.id === gap.body.message.id), true);
    });

    await t.test("Socket handshake rejects missing, invalid, and expired tokens", async () => {
      for (const token of [undefined, "invalid.token.value", sign(accounts.alice.user.id, -1)]) {
        await assert.rejects(connect(token), /Authentication required|Invalid or expired/);
      }
    });

    await t.test("Nonmembers cannot subscribe/write/receive in either direct or group rooms", async () => {
      const outsider = await connect(accounts.dave.token);
      const received = [];
      outsider.on("message:new", message => received.push(message));
      for (const id of [direct, group]) {
        assert.equal((await outsider.timeout(3000).emitWithAck("conversation:join", id)).ok, false);
        assert.equal((await outsider.timeout(3000).emitWithAck("message:send", { conversationId: id, content: "forbidden" })).ok, false);
        assert.equal((await request(`/api/conversations/${id}/messages`, { token: accounts.alice.token, method: "POST", body: { content: "Member only" } })).status, 201);
      }
      await new Promise(resolve => setTimeout(resolve, 150));
      assert.equal(received.length, 0);
    });

    await t.test("Transient activity reaches current members without subscriptions and excludes outsiders", async () => {
      const bob = await connect(accounts.bob.token);
      const dave = await connect(accounts.dave.token);
      const rejected = [];
      dave.on("conversation:activity", event => rejected.push(event));
      const activity = once(bob, "conversation:activity", { signal: AbortSignal.timeout(4000) });
      const result = await request(`/api/conversations/${group}/messages`, { token: accounts.alice.token, method: "POST", body: { content: "Transient notice" } });
      const notice = (await activity)[0];
      assert.deepEqual(notice, { conversationId: group, sender: accounts.alice.user.id, messageId: result.body.message.id });
      assert.ok(await db.collection("messages").findOne({ _id: new mongoose.Types.ObjectId(notice.messageId) }));
      await new Promise(resolve => setTimeout(resolve, 150));
      assert.equal(rejected.length, 0);
    });

    await t.test("Live HTTP/socket delivery matches persisted records and sender acknowledgement", async () => {
      const bob = await connect(accounts.bob.token);
      const alice = await connect(accounts.alice.token);
      for (const socket of [alice, bob]) assert.equal((await socket.timeout(3000).emitWithAck("conversation:join", direct)).ok, true);
      const event = once(bob, "message:new", { signal: AbortSignal.timeout(4000) });
      const result = await request(`/api/conversations/${direct}/messages`, { token: accounts.alice.token, method: "POST", body: { content: "Live HTTP" } });
      assert.equal((await event)[0].id, result.body.message.id);
      const nextEvent = once(bob, "message:new", { signal: AbortSignal.timeout(4000) });
      const sent = await alice.timeout(3000).emitWithAck("message:send", { conversationId: direct, content: "Live socket" });
      assert.equal(sent.ok, true);
      assert.equal((await nextEvent)[0].id, sent.message.id);
      assert.ok(await db.collection("messages").findOne({ _id: new mongoose.Types.ObjectId(sent.message.id) }));
      assert.equal((await alice.timeout(3000).emitWithAck("message:send", { conversationId: direct, content: " " })).ok, false);
      bob.disconnect();
      const missed = await request(`/api/conversations/${direct}/messages`, { token: accounts.alice.token, method: "POST", body: { content: "While Bob disconnected" } });
      const reconnected = await connect(accounts.bob.token);
      assert.equal((await reconnected.timeout(3000).emitWithAck("conversation:join", direct)).ok, true);
      const history = await request(`/api/conversations/${direct}/messages`, { token: accounts.bob.token });
      assert.equal(history.body.messages.some(m => m.id === missed.body.message.id), true);
    });
  } finally {
    for (const socket of sockets) socket.disconnect();
    await stop();
    if (db) await db.close();
  }
});
