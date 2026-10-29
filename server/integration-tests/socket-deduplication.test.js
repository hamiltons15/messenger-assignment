const test = require("node:test");
const assert = require("node:assert/strict");
const { io } = require("socket.io-client");

const BASE_URL = "http://localhost:3000";
const CONVERSATION_ID = "6ae381984e52c92cc1c1a407";

test("Sender receives acknowledgement and event without duplicate display", async () => {
  const password = process.env.TP7_TEST_PASSWORD;

  assert.ok(
    password,
    "Set TP7_TEST_PASSWORD before running integration tests"
  );

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: "tp7_member_a",
      password
    })
  });

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.ok(data.token);

  const socket = io(BASE_URL, {
    auth: { token: data.token },
    reconnection: false,
    timeout: 5000,
    autoConnect: false
  });

  const displayedMessages = new Map();

  function displayMessage(message) {
    if (!displayedMessages.has(message.id)) {
      displayedMessages.set(message.id, message);
    }
  }

  try {
    const connected = new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
    });

    socket.connect();
    await connected;

    const join = await socket.timeout(5000).emitWithAck(
      "conversation:join",
      CONVERSATION_ID
    );

    assert.equal(join.ok, true);

    const eventPromise = new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), 5000);

      socket.once("message:new", message => {
        clearTimeout(timer);
        displayMessage(message);
        resolve(message);
      });
    });

    const acknowledgement = await socket.timeout(5000).emitWithAck(
      "message:send",
      {
        conversationId: CONVERSATION_ID,
        content: `TP7 deduplication test ${Date.now()}`
      }
    );

    assert.equal(acknowledgement.ok, true);
    displayMessage(acknowledgement.message);

    const receivedEvent = await eventPromise;

    assert.ok(receivedEvent, "Sender must receive message:new");

    assert.equal(
      acknowledgement.message.id,
      receivedEvent.id
    );

    assert.equal(
      displayedMessages.size,
      1,
      "The same message must appear only once"
    );
  } finally {
    socket.disconnect();
  }
});
