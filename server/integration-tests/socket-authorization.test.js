const test = require("node:test");
const assert = require("node:assert/strict");
const { io } = require("socket.io-client");

const BASE_URL = "http://localhost:3000";
const DIRECT_ID = "6ae381984e52c92cc1c1a407";
const GROUP_ID = "6ae38611a2148f12e26bcf9a";
const MEMBER_C_ID = "6ae384f4a2148f12e26bcf99";

async function login(username, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.ok(data.token);

  return data.token;
}

async function connectSocket(token) {
  const socket = io(BASE_URL, {
    auth: { token },
    reconnection: false,
    timeout: 5000,
    autoConnect: false
  });

  try {
    const connected = new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
    });

    socket.connect();
    await connected;

    return socket;
  } catch (error) {
    socket.disconnect();
    throw error;
  }
}

test("Member C is denied direct conversation access but allowed group access", async () => {
  const password = process.env.TP7_TEST_PASSWORD;

  assert.ok(
    password,
    "Set TP7_TEST_PASSWORD before running integration tests"
  );

  const token = await login("tp7_member_c", password);
  const socket = await connectSocket(token);

  try {
    const directJoin = await socket.timeout(5000).emitWithAck(
      "conversation:join",
      DIRECT_ID
    );

    assert.equal(directJoin.ok, false);

    const directWrite = await socket.timeout(5000).emitWithAck(
      "message:send",
      {
        conversationId: DIRECT_ID,
        content: "This message must be rejected."
      }
    );

    assert.equal(directWrite.ok, false);
    assert.equal(directWrite.code, "not_found");

    const groupJoin = await socket.timeout(5000).emitWithAck(
      "conversation:join",
      GROUP_ID
    );

    assert.equal(groupJoin.ok, true);

    const groupWrite = await socket.timeout(5000).emitWithAck(
      "message:send",
      {
        conversationId: GROUP_ID,
        content: `TP7 authorized group test ${Date.now()}`
      }
    );

    assert.equal(groupWrite.ok, true);
    assert.equal(groupWrite.message.conversation, GROUP_ID);
    assert.equal(groupWrite.message.sender, MEMBER_C_ID);
  } finally {
    socket.disconnect();
  }
});
