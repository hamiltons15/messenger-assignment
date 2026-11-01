# Messenger Implementation Verification

## Purpose

This document records the implementation tests performed for the Messenger application, their results, and any known limitations.

## IA-06 release verification — October 31, 2026

This section records current completion work separately from the historical TP1–TP8 records below. Historical outcomes are preserved and were not rewritten as new executions. Browser observations here came from actual Firefox instances; API/socket tests alone are not browser evidence.

### Reproduce the automated checks

From the root after README installation and local MongoDB startup:

```bash
npm test
npm run test:integration
npm run lint
npm run build
npm run test:browser
npm run test:release
docker compose config --quiet
git diff --check
```

Unit/helper checks need no database or real secret. Integration creates a new `messenger_ia06_test_<timestamp>_<random>` database on `127.0.0.1:27017`, provisions Alice/Bob/Carol/Dave itself, generates a private process-local signing key, selects a free API port, and stops only the backend it starts. It does not reuse development fixtures or read .env values as configuration; supplied process environment overrides dotenv. It retains test records and never drops collections/databases. `MESSENGER_TEST_MONGO_PORT` selects another local MongoDB port. No application .env file is needed for these checks.

The browser runner uses Python 3 standard-library Marionette control of installed Firefox, four independent headless profiles, isolated backend/Vite ports, and a fresh `messenger_ia06_browser_*` database. No new browser-testing dependency is installed. Its Firefox profiles/logs remain ignored under `.release-check/`; do not submit or share them. It observes rendered text and uses the actual forms, rather than substituting API creation for browser creation. Unauthorized checks deliberately call HTTP from an authenticated browser; separate integration cases also reject unauthorized socket joins/writes and check that outsiders receive no protected events.

`npm run test:legacy --prefix server` retains the old fixed-fixture TP7 checks but is not part of release verification: it needs the original accounts/IDs and writes to those conversations. Do not run it against normal development records just to reproduce current tests.

### Newly executed results

| Check | Observed result | Evidence/limit |
|---|---|---|
| Phase A backend units | 28 passed, 0 failed | Existing 25 plus username invitation/registration validation checks. |
| Phase A isolated integration | 12 passed, 0 failed | Fresh `messenger_ia06_test_1793488155043_d5f69dde`; 11 named cases plus the parent test. |
| Phase B client helper tests | 5 passed, 0 failed | HTTP status, network/non-JSON errors, cancellation, stable-ID merge and timestamps. These are not component/browser tests. |
| Phase C integration before activity notices | 18 passed, 0 failed | `messenger_ia06_test_1793488560609_89515354`; 17 named cases plus parent. |
| Client lint and production build | Passed | Vite built 47 modules after helper extraction; build output remains ignored. |
| Firefox acceptance run | All five scenarios and reselection passed | `messenger_ia06_browser_1793488757_2e43a769`, four actual Firefox profiles. |
| Expanded Firefox run | All five scenarios, browser HTTP/Socket.IO sends without visible duplicates, reselection, backend outage/restart recovery, and JWT-expiry cleanup passed | `messenger_ia06_browser_1793489600_cfc124bf`; actual rendered UI observations. Short test JWT injected into one isolated login response; default eight-hour policy unchanged. |
| Final complete automated/release run | **29 backend units, 5 client helpers, 19 integration checks passed; lint/build/Compose/smoke checks passed** | Fresh source export `.release-check/source_1793489792529_9f4b9351` (60 source files); fresh integration DB `messenger_ia06_test_1793489798705_5cff97c3`. |
| Final Firefox regression | **All five browser scenarios, off-conversation activity, socket deduplication, reselection, outage/recovery, and session expiry passed** | `messenger_ia06_browser_1793489795_4bdd5730`; four real independent Firefox profiles. |

The controlled race check explicitly performs history GET, saves a message before Bob subscribes, then joins Bob. The message is absent from both the original snapshot and Bob's live events, but present in post-join history. The client now synchronizes after every authorized join and scans all pages, merging by ID, including when newer live messages have already arrived. This avoids relying on a newest-record boundary that could skip an earlier gap.

Initial Phase B lint attempts failed for an incomplete helper edit, a removed ref still referenced, and the configured error-cause rule. These were corrected; later lint/test/build runs passed. A read-only Docker status check failed with permission denied on `/var/run/docker.sock`; direct local MongoDB ping succeeded. Verification did not change Docker permissions or stop/reset the database service.

### Fresh-source release observations

`npm run test:release` completed successfully from a source export containing current tracked files and nonignored new files, with no copied node_modules, .env, build output, or instructor materials. `npm ci` succeeded at root, server (125 packages), and client (150 packages); backend tests verified bcrypt hashing/comparison. npm reported that bcrypt's install script was not covered by the local allowScripts policy; installation and runtime checks nevertheless passed using the installed package. No npm/system policy was changed.

The exported source passed 29 backend unit tests, 5 client helper tests, and 19 integration checks (18 named cases plus the parent test), with zero failures/skips. ESLint and Vite production build passed. `docker compose config --quiet` passed. A built-client preview served HTML; its authenticated API proxy rejected a missing JWT with 401; its Socket.IO transport endpoint responded with 200. Backend/preview ran on allocated ports with generated release database `messenger_ia06_release_1793489792529_9f4b9351`. Those processes were stopped by the checker; databases were retained. No development backend/database was restarted by this check.

This establishes fresh-source dependency installation, checks, build, and local startup using the already-running MongoDB. It is **not** a claimed test of a final committed clone or newly provisioned Docker service. After owner review/commit, repeat the README steps from the actual final clone before submission. The uncommitted source export is intentional because automatic commits/pushes are forbidden.

### Exact browser acceptance demonstration (Ubuntu)

Use a disposable demonstration database, not personal/development messages. For example, in a backend terminal:

```bash
cd server
MONGO_URI=mongodb://127.0.0.1:27017/messenger_ia06_manual_20261031 npm start
```

This uses the configured server secret/port without changing your .env file. Choose a new database name for another independent demonstration. Run `npm run start:client` from the root in another terminal. Open http://127.0.0.1:5173 in independent browser profiles for Alice, Bob, Carol, and unrelated Dave. Register each through **Create an account**, then log in separately. Use disposable passwords and keep credentials/tokens out of screenshots.

| Scenario | Exact steps | Expected outcome | Observed evidence |
|---|---|---|---|
| 1. Direct browser exchange | Alice chooses Direct, enters `bob`, creates; Bob refreshes conversations and selects the direct. Alice sends `IA06 Alice direct live`; Bob replies `IA06 Bob direct reply`. | Both sessions show both messages with correct senders. No API calls or MongoDB IDs needed to create/use the conversation. | Passed in the actual automated Firefox runs. Historical TP8 Chrome/Incognito exchange also retained below. |
| 2. Live delivery | Keep both conversations open. Alice sends once; Bob leaves his page untouched. Optionally select Socket.IO for Bob's reply. | Message appears without refresh; sender response/event merge produces one visible message. | Passed in Firefox, including an explicit one-visible-copy check for a Socket.IO send. |
| 3. Logout/offline recovery | Bob clicks Log out. Alice sends `IA06 while Bob logged out`. Bob logs in again and selects the direct. | Missed message is loaded from MongoDB history. | Passed in Firefox as this exact sequence. Separate API integration restarts the backend and checks saved IDs/content. |
| 4. Group plus unrelated user | Alice selects Group, enters `bob, carol`, names it, and creates. Bob/Carol refresh and open it. Each member sends a distinct message and sees all contributions. Dave refreshes; group must remain absent. Run the explicit negative checks below as Dave. | Three members read/contribute; Dave cannot read/send, subscribe, or receive protected group events. | Browser creation, every member's contribution/receipt, Dave's list exclusion, and browser HTTP 404 read/write passed. Independent socket integration verifies denied group join/write and absence of protected messages/activity. |
| 5. Private outsider attempt | While Carol/Dave are independently logged in, issue the direct negative HTTP check below against Alice/Bob's direct. | HTTP 404 without protected messages; socket join/write rejected in integration. | Direct negative HTTP checks passed from both unrelated Firefox sessions. Socket denials separately passed integration. |

To repeat the direct HTTP negative checks manually without entering a MongoDB ID, keep Alice's direct selected, open her browser console, and obtain its ID from an actual history request (not a token):

```js
performance.getEntriesByType('resource').map(e => e.name)
  .filter(n => /conversations\/[^/]+\/messages/.test(n))
  .at(-1)?.match(/conversations\/([^/]+)\/messages/)[1]
```

Copy this nonsensitive test conversation ID. In Dave's console, run the following; enter Dave's disposable password at the prompt. The token stays in the closure and is never printed:

```js
(async () => {
  const id = prompt('Test conversation ID from Alice');
  const password = prompt('Dave disposable password');
  const login = await fetch('/api/auth/login', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username: 'dave', password})
  });
  if (!login.ok) throw new Error('Dave login failed; do not interpret this as authorization evidence.');
  const {token} = await login.json();
  const headers = {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'};
  const read = await fetch(`/api/conversations/${id}/messages`, {headers});
  const write = await fetch(`/api/conversations/${id}/messages`, {
    method: 'POST', headers, body: JSON.stringify({content: 'must be rejected'})
  });
  console.log({historyStatus: read.status, sendStatus: write.status});
})();
```

Expected: `{historyStatus: 404, sendStatus: 404}` for both the direct and the group. Repeat for Carol's valid account against the direct, changing the username. API/ID use here is intentional adversarial verification, not a requirement for normal messaging workflows. For Socket.IO negatives, run `npm run test:integration`; named cases reject direct/group joins and writes, exclude protected events, and test removal revocation. Do not screenshot Network authorization headers.

Record the observer/date, account names, browser profiles, exact message texts, expected/actual statuses, and any failed steps. Screenshots can supplement the record but must not contain passwords/JWTs. An additional interactive hand-operated run has not been claimed; the new observations are explicitly automated Firefox executions.

### Reliability demonstrations

- Select the already-open conversation twice: history stays visible and loading finishes. This passed actual Firefox.
- With only the isolated test backend stopped, an HTTP send shows an unconfirmed-delivery error, retains the draft, and adds no fake message. Restarting that same backend restores live status/history. This passed Firefox; the runner stops only its own backend.
- A short-lived, correctly signed test JWT causes the server to disconnect the socket and the UI to clear the composer/history and return to login with an expiration message. This passed Firefox. No production token lifetime was shortened.
- Unit/helper tests cover unreadable proxy responses and cancellation; integration verifies malformed JSON returns safe HTTP 400 JSON rather than an HTML stack page.
- Sent means server persistence, not Delivered or Read. A lost response can leave actual storage uncertain. Automatic write retries/idempotency keys are not implemented; inspect Refresh history before retrying.

### Current scope and release limits

Profile editing, persistent unread positions/counts, and browser edit/delete/member-management controls are approved deferrals. Existing owner/creator-authorized APIs remain and are regression-tested. Transient activity notices remain in scope; they are not persisted unread tracking. No deferred functionality is claimed complete.

Fresh-source installation/build/start evidence is recorded after release verification below. Docker Compose configuration can be validated without daemon access, but new container/volume provisioning cannot be certified here because Docker socket access is denied. Existing local MongoDB is reachable and all test writes use generated test databases. No clean committed clone or remote submission is claimed before the owner commits/pushes. No secrets, normal database records, or reference files were modified.

## Historical TP1–TP8 evidence (preserved)

The following sections retain their original test counts and limitations. Statements about frontend integration being unfinished describe the earlier stage and are superseded where current observed evidence above explicitly covers the behavior.

## 1. Accounts and Authentication

The following functionality has been implemented and tested:

- User registration and login.
- Password hashing using bcrypt.
- JWT authentication for protected endpoints.
- Rejection of requests with missing or invalid authentication tokens.

### Automated Authentication and JWT Tests

Automated security tests were implemented using Node.js's built-in test runner. The tests are located in `server/tests/token.test.js` and `server/tests/auth.test.js`.

The following nine tests passed:

1. Valid JWT contains the correct user ID.
2. Tampered JWT is rejected.
3. Expired JWT is rejected.
4. JWT with an incorrect audience is rejected.
5. JWT with an incorrect issuer is rejected.
6. Missing authorization header is rejected.
7. Invalid JWT is rejected.
8. Empty Bearer token is rejected.
9. Valid JWT authenticates the user.

The tests verify that JWT signatures and claims are validated and that the authentication middleware rejects invalid requests. They also confirm that a valid token allows the request to continue with the authenticated user's ID.

**Verification command:** `cd server && npm test`

**Result:** 9 tests passed, 0 failed.


## 2. Conversation Creation

The following functionality has been implemented and tested:

- Creating direct conversations between two registered users.
- Creating group conversations with at least three distinct members.
- Validating conversation types and member IDs.
- Rejecting duplicate member IDs.
- Verifying that conversation members exist.
- Requiring the authenticated user to be a conversation member.
- Rejecting duplicate direct conversations in sequential requests.

## 3. Database Persistence and Failure Handling

The following tests passed:

- Direct conversations were saved and retrieved from MongoDB.
- Group conversations were saved and retrieved from MongoDB.
- Conversation data remained available after restarting MongoDB.
- The API returned a controlled error during a database outage.
- The API resumed database operations after MongoDB restarted.

### Database Readiness and Recovery Verification (Tech Primer 5)

The Messenger backend was updated to check MongoDB connection readiness before processing database dependent API requests.

The following tests were completed:

1. **Database connection at startup:** Express successfully connected to MongoDB and initialized the User model's indexes before accepting requests.
2. **Database unavailable at startup:** With MongoDB stopped, the application failed to start and reported `connect ECONNREFUSED 127.0.0.1:27017`.
3. **Database unavailable during operation:** After stopping MongoDB while Express was running, a request to `GET /api/auth/me` returned HTTP 503 with `{"error":"Database unavailable."}`.
4. **Database recovery:** After restarting MongoDB, the same endpoint returned HTTP 401 for a request without a JWT, confirming that the database readiness check recognized the restored connection and authentication middleware continued operating.

**Result:** All four checks passed.

These tests verify that the application handles database disconnections without continuing database dependent requests and can recover after MongoDB becomes available again.


## 4. Known Limitations

- React interface integration for the implemented backend features remains to be verified.
- Additional database failure, concurrency, and network interruption scenarios remain to be tested.
- Socket.IO offline recovery and duplicate handling have been demonstrated in Node.js integration scripts but have not yet been verified in the React interface.
- Message submission retries after acknowledgement timeouts do not currently have a verified persistent idempotency mechanism.


## 5. Verification Status

The implemented authentication and conversation creation functionality has passed the tests recorded above. Additional verification will be completed as development continues.

### FR-12: Authorized Conversation Listing

**Implementation:** `GET /api/conversations`

**Date Tested:** October 28, 2026

**Description:**

Implemented an authenticated endpoint that retrieves conversations containing the requesting user's verified JWT identity in their membership list. The endpoint returns conversation information without exposing unrelated conversations or user password hashes.

**Verification Results:**

| Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|
| Authenticated user with no conversations | HTTP 200 with empty conversation array | HTTP 200 with empty array | PASS |
| Request without JWT | HTTP 401 Unauthorized | HTTP 401 | PASS |
| Alice retrieves shared direct conversation | HTTP 200 with conversation | HTTP 200 with conversation | PASS |
| Bob retrieves shared direct conversation | HTTP 200 with conversation | HTTP 200 with conversation | PASS |
| Carol attempts to list conversations | Shared conversation excluded | HTTP 200 with empty array | PASS |
| MongoDB unavailable | HTTP 503 Service Unavailable | HTTP 503 | PASS |
| MongoDB restored | HTTP 200 with persisted conversation | HTTP 200 with conversation | PASS |

**Conclusion:**

The authorized conversation listing endpoint passed all seven manual verification scenarios. The results demonstrate that the backend filters conversations using authenticated membership and handles database interruptions without exposing unauthorized conversation data.

**Evidence:** Terminal output from registration, login, conversation creation, authorized and unauthorized listing requests, and MongoDB failure and recovery testing.

### Message Creation and History Verification

**Features tested:** Authenticated message creation, conversation membership authorization, sender identity enforcement, message content validation, persistent history retrieval, and cursor-based pagination.

**Test environment:** Ubuntu VM, Node.js/Express backend, MongoDB with Mongoose, and curl.

**Results:**

1. **Authenticated message creation:** Alice successfully created a message in an existing direct conversation. The server returned HTTP 201 with the stored message ID, conversation ID, sender ID, content, and creation timestamp. PASS.
2. **Unauthorized message creation:** Carol attempted to send a message to a conversation she was not a member of. The server returned HTTP 404. PASS.
3. **Message content validation:** Whitespace-only content and content exceeding 2,000 characters both returned HTTP 400. PASS.
4. **Sender identity enforcement:** Alice submitted a message containing Bob's ID in the `sender` field. The server stored Alice's authenticated ID instead. PASS.
5. **Authorized message history:** Alice retrieved previously stored messages using the protected history endpoint. The server returned HTTP 200 with messages ordered newest first. PASS.
6. **Unauthorized history retrieval:** Carol attempted to retrieve Alice and Bob's conversation history. The server returned HTTP 404 without exposing messages. PASS.
7. **Cursor-based pagination:** Eight messages were retrieved across two pages. The first page contained five messages and a cursor. The second contained the remaining three messages, with no duplicates and a null final cursor. PASS.
8. **Persistence verification:** Previously created messages were retrieved again with matching IDs, content, and timestamps. PASS for retrieval; application restart verification depends on confirming Express was restarted.

9. **Persistence after Express Restart** Express was stopped and restarted while MongoDB remained running. Alice successfully retrieved previously stored messages with matching IDs, content, and timestamps. PASS.

**Conclusion:** The implemented message creation and history endpoints passed the tested validation, authentication, authorization, and pagination scenarios. Additional testing remains necessary for database failures, concurrent requests, and other Messenger features.

### FR-06 — Message Editing and Deletion Verification

**Test environment:** Ubuntu VM, Node.js/Express, MongoDB/Mongoose, JWT authentication, and curl.

**Deletion behavior:** Soft deletion. Deleted messages retain their database records but display "This message was deleted." instead of their original content.

**Verification results:**

1. **Authorized editing:** Alice successfully edited her own message. The server returned HTTP 200 with updated content and an `editedAt` timestamp. PASS.
2. **Unauthorized editing:** Bob attempted to edit Alice's message. The server returned HTTP 404. PASS.
3. **Authorized deletion:** Alice successfully soft deleted her message. The server returned HTTP 200 with a deletion placeholder and `deletedAt` timestamp. PASS.
4. **History after deletion:** The history endpoint returned the deleted message with its original ID, sender, creation timestamp, edit timestamp, and deletion placeholder. PASS.
5. **Editing after deletion:** Alice attempted to edit the deleted message. The server returned HTTP 404. PASS.
6. **Repeated deletion:** Alice attempted to delete the same message again. The server returned HTTP 404. PASS.
7. **Unauthorized deletion:** Bob attempted to delete an active message belonging to Alice. The server returned HTTP 404. PASS.
8. **Persistence after restart:** Express was restarted while MongoDB remained running. The history endpoint returned the deleted message with unchanged `editedAt` and `deletedAt` timestamps and the deletion placeholder. PASS.

**Conclusion:** The tested FR-06 backend functionality satisfies the established editing, soft deletion, sender authorization, and persistence behavior. Browser interface integration and additional failure scenarios remain to be verified.

### Group Membership Management and History Access Verification

**Date:** October 29, 2026

**Feature:** Group membership management and authorization

**Requirements and decisions:** Group management functionality, UQ-03, and UQ-04.

**Test environment:** Node.js, Express, MongoDB, and authenticated HTTP requests using curl.

**Test setup:** Created a group conversation with Alice, Bob, and Carol. Alice was the group creator. A fourth test user, Dave, was used to verify membership changes and history access.

| Test | Expected Result | Actual Result | Status |
|---|---|---|---|
| Create a group with three members | HTTP 201 | HTTP 201 | PASS |
| Creator adds a fourth member | HTTP 200 | HTTP 200 | PASS |
| Creator attempts to add a duplicate member | HTTP 409 | HTTP 409 | PASS |
| Noncreator attempts to add a member | HTTP 403 | HTTP 403 | PASS |
| Noncreator attempts to remove a member | HTTP 403 | HTTP 403 | PASS |
| Creator removes the fourth member | HTTP 200 | HTTP 200 | PASS |
| Creator attempts to reduce group below three members | HTTP 409 | HTTP 409 | PASS |
| Creator attempts to remove themselves | HTTP 403 | HTTP 403 | PASS |
| Removed member retrieves message history | HTTP 404 | HTTP 404 | PASS |
| Removed member attempts to send a message | HTTP 404 | HTTP 404 | PASS |
| Creator sends a message while fourth member is removed | HTTP 201 | HTTP 201 | PASS |
| Creator readds the fourth member | HTTP 200 | HTTP 200 | PASS |
| Readded member retrieves previously stored messages | HTTP 200 | HTTP 200 | PASS |
| Readded member retrieves group membership after backend restart | HTTP 200 | HTTP 200 | PASS |
| Readded member retrieves stored history after backend restart | HTTP 200 | HTTP 200 | PASS |

**Verification summary:**

The backend successfully enforced creator-only group membership management. Duplicate membership additions were rejected, the group could not be reduced below three members, and the creator could not remove themselves.

Removing a member immediately revoked their ability to retrieve conversation history or send messages. After the member was readded, they could retrieve a message created while they were removed.

The group membership and stored message history remained accessible after restarting the Express backend.

**Conclusion:** The tested group membership management and history access behaviors passed verification.

### Direct Conversation Uniqueness Verification (UQ-11)

**Date:** October 29, 2026

**Feature:** Duplicate direct conversation prevention

**Decision:** Each pair of users may have only one direct conversation. The backend uses a canonical pair key generated by sorting the two user IDs. MongoDB enforces uniqueness through a unique partial index on `directKey`.

**Test environment:** Node.js, Express, Mongoose, MongoDB, and curl.

**Implementation:**

- Added `directKey` to the Conversation model.
- Added a unique partial index for direct conversation keys.
- Migrated three existing direct conversations to canonical keys.
- Updated the conversation creation endpoint to generate and store canonical keys.
- Added HTTP 409 handling for existing conversations and MongoDB duplicate-key errors.

| Test | Expected Result | Actual Result | Status |
|---|---|---|---|
| JavaScript syntax validation | Exit status 0 | Exit status 0 | PASS |
| Existing direct conversation migration | Three conversations updated | Three updated | PASS |
| Unique index creation | Successful | Successful | PASS |
| Create duplicate Alice and Bob conversation | HTTP 409 | HTTP 409 | PASS |
| Reverse Alice and Bob member order | HTTP 409 | HTTP 409 | PASS |
| Send two concurrent Alice and Dave creation requests | One HTTP 201 and one HTTP 409 | HTTP 201 and HTTP 409 | PASS |
| Query database for Alice and Dave direct conversations | Exactly one | Exactly one | PASS |

**Database verification:**

The database contained exactly one direct conversation for Alice and Dave.

Conversation ID: `6ae352d34915f724d0c2fb7f`

Canonical key: `6ae27fc7ab1f7f38bdfab020:6ae346550c9ad2815eb79e80`

**Conclusion:**

The backend successfully prevented duplicate direct conversations regardless of member order. Concurrent creation requests produced one successful conversation and one conflict response. The database query confirmed that only one matching conversation was stored.

UQ-11's tested direct conversation uniqueness behavior passed verification.

### History Cursor Authorization Verification

**Date:** October 29, 2026

**Reference:** Tech Primer 6 (Ch04f), Slide 62

| Test | Expected | Actual | Status |
|---|---|---|---|
| Malformed history cursor | HTTP 400 | HTTP 400 | PASS |
| Cursor from another conversation | HTTP 400 | HTTP 400 | PASS |
| Nonmember supplies a history cursor | HTTP 404 | HTTP 404 | PASS |

**Conclusion:** The backend rejected malformed and cross-conversation cursors. It also enforced conversation membership before allowing an unauthorized user to retrieve history.

### Automated Input Validation and API Regression Verification

**Reference:** Tech Primer 6 (Ch04f), Slides 24–26 and 65

**Implementation:**

- Added `utils/validateConversation.js` to validate conversation types, member arrays, member IDs, member counts, and duplicate members.
- Updated the conversation creation endpoint to use the shared validation utility.
- Added `utils/validateMessage.js` to validate message content.
- Updated the message creation and editing endpoints to use the shared message validation utility.
- Added automated conversation and message validation tests using Node.js's built-in test runner.
- Preserved existing authentication, authorization, and database operations.

**Automated Test Results:**

Command: `node --test tests/*.test.js`

| Test Category | Passed | Failed | Status |
|---|---|---|---|
| Authentication and JWT | 9 | 0 | PASS |
| Conversation input validation | 8 | 0 | PASS |
| Message input validation | 8 | 0 | PASS |
| **Total** | **25** | **0** | **PASS** |

**API Regression Verification:**

| Test | Expected Result | Actual Result | Status |
|---|---|---|---|
| Create conversation with invalid type | HTTP 400 | HTTP 400 | PASS |
| Create message with whitespace-only content | HTTP 400 | HTTP 400 | PASS |
| Edit message with whitespace-only content | HTTP 400 | HTTP 400 | PASS |

All three API regression tests returned the expected validation error messages.

**Conclusion:**

All 25 automated tests passed successfully. The conversation and message validation utilities correctly handled the tested valid and invalid inputs. The Express API regression tests confirmed that the refactored endpoints continued rejecting invalid input with the expected HTTP responses. Existing authentication and JWT tests also continued passing.

These results verify the tested input validation behavior. They do not replace the separate membership, persistence, pagination, and authorization tests documented in earlier sections.

### Tech Primer 7 — Socket.IO and Real-Time Communication Verification

**Reference:** Tech Primer 7 (Ch04G), Socket.IO and Real-Time Communication

**Test environment:** Ubuntu VM, Node.js, Express, Socket.IO, Socket.IO Client, MongoDB/Mongoose, JWT authentication, and Node.js integration scripts.

**Implementation:**

- Configured Socket.IO to use the existing HTTP server.
- Implemented Socket.IO authentication using the existing JWT verification function.
- Used the verified JWT subject as the authenticated socket user ID.
- Implemented socket disconnection when the authenticated JWT expires.
- Added user-specific Socket.IO rooms.
- Implemented authorized conversation room joining.
- Implemented conversation room leaving and rejoining.
- Added real-time `message:new` notifications after successful HTTP message persistence.
- Created a shared message persistence function used by HTTP and Socket.IO message submissions.
- Implemented `message:send` with acknowledgements.
- Enforced MongoDB conversation membership checks for Socket.IO message submissions.
- Implemented live room revocation when a group member is removed.
- Verified offline message recovery through the authenticated HTTP history endpoint.
- Demonstrated client-side duplicate handling using message IDs.

**Authentication and Authorization Verification:**

- Missing, invalid, and expired JWTs were rejected during Socket.IO authentication.
- A valid JWT allowed the authenticated socket to connect.
- A short-lived JWT caused the socket to disconnect after expiration.
- Authorized members successfully joined conversation rooms.
- Nonmembers were denied access to conversation rooms.
- Removing a group member revoked their existing room subscription.
- Removed members could not rejoin the conversation.

**HTTP Message Broadcast Verification:**

- An authorized HTTP message submission returned HTTP 201.
- The message was persisted before the real-time notification.
- Authorized conversation subscribers received `message:new`.
- The delivered message matched the saved message ID.
- A nonmember did not receive the notification.

**Socket.IO Message Submission Verification:**

| Test | Result |
|---|---|
| Saved acknowledgement and verified sender | PASS |
| Live delivery to another conversation member | PASS |
| Invalid message content rejected | PASS |
| Nonmember Socket.IO write rejected | PASS |
| Saved message found in HTTP history | PASS |

**Conversation Room Leaving Verification:**

| Test | Result |
|---|---|
| Receives messages before leaving | PASS |
| Leave acknowledged; socket remains connected | PASS |
| No notifications after leaving | PASS |
| Authorized rejoin succeeds | PASS |
| Notifications resume after rejoining | PASS |

**Offline Recovery and Duplicate Handling Verification:**

| Test | Result |
|---|---|
| Member disconnected successfully | PASS |
| Offline message recovered from HTTP history | PASS |
| Live notifications resumed after reconnect | PASS |
| Duplicate message IDs handled using a JavaScript Map | PASS |

**Automated Regression and Integration Tests:**

Unit test command: `cd server && npm test`

Result: 25 tests passed, 0 failed.

The unit tests cover authentication middleware, JWT verification, conversation validation, and message validation.

Socket.IO integration test command:

`cd server && TP7_TEST_PASSWORD='<test-password>' npm run test:integration`

Result: 2 tests passed, 0 failed.

The permanent integration tests are stored in:

- `server/integration-tests/socket-authorization.test.js`
- `server/integration-tests/socket-deduplication.test.js`

These tests require the Express server and MongoDB to be running, along with the existing test accounts and conversations.

The integration tests create authorized messages in MongoDB. They are deliberately excluded from the standard `npm test` command.

The controlled MongoDB outage test was performed separately and is not part of the routine integration-test suite.

**Known Limitations and Remaining Work:**

- Offline recovery and duplicate handling were demonstrated using Node.js test clients; React interface integration has not yet been verified.
- Automatic Socket.IO reconnection, token renewal, and history synchronization after transient connection loss require additional client-side verification.
- The MongoDB readiness check prevents submissions when Mongoose is already disconnected, but does not eliminate all possible connection-loss races or buffered operations.
- The current implementation does not guarantee exactly-once message creation when clients retry after acknowledgement timeouts. Client-generated request IDs and server-side idempotency controls remain future reliability improvements.
- The permanent integration tests depend on previously created test accounts and conversation IDs. They do not currently provision an isolated test database or fixtures.
- The controlled MongoDB outage test is not yet part of an automated, repeatable test suite.

**Conversation-Specific Authorization Verification:**

A single authenticated user was tested against two different conversations. Member C was not a member of the direct conversation but was an authorized member of the group conversation.

| Test | Result |
|---|---|
| Member C denied direct conversation room access | PASS |
| Member C denied direct conversation message submission | PASS |
| Member C successfully joined the authorized group conversation | PASS |
| Member C successfully submitted a group message | PASS |

These results demonstrate that Socket.IO authorization depends on conversation membership rather than authentication alone.

**MongoDB Outage and Message Persistence Verification:**

A controlled database outage was performed by temporarily stopping the MongoDB Docker Compose service while two authenticated Socket.IO clients remained connected.

The initial test exposed a delayed-write issue: the client acknowledgement timed out, but Mongoose subsequently persisted the message after MongoDB restarted.

To address the observed behavior, a MongoDB connection readiness check was added to `server/services/createMessage.js` before querying conversation membership.

After restarting the server, the outage test was repeated.

| Test | Result |
|---|---|
| Authenticated Socket.IO clients connected before outage | PASS |
| MongoDB service stopped successfully | PASS |
| Failed submission returned `ok: false`, `code: "server_error"` | PASS |
| No `message:new` notification during failed submission | PASS |
| MongoDB restarted successfully | PASS |
| No delayed message persisted after recovery | PASS |

The database was queried after recovery to verify that the second failed submission had not been saved. Only the message from the original test remained.

The readiness check addresses the tested disconnected-state scenario but does not eliminate all possible races if MongoDB becomes unavailable during an operation.

**Sender Acknowledgement and Duplicate-Display Verification:**

The sender joined the conversation room before submitting a Socket.IO message.

| Test | Result |
|---|---|
| Sender received successful `message:send` acknowledgement | PASS |
| Sender received corresponding `message:new` notification | PASS |
| Acknowledgement and notification contained the same message ID | PASS |
| Test client displayed the message only once using a Map keyed by message ID | PASS |

This verifies the deduplication approach in a Node.js test client. React interface behavior has not yet been tested.

**Conclusion:**

The tested TP7 backend functionality passed authentication, conversation-specific authorization, real-time delivery, Socket.IO submission, membership revocation, room management, offline recovery, and sender acknowledgement/deduplication verification.

All 25 unit tests and both permanent Socket.IO integration tests passed.

A controlled MongoDB outage initially revealed delayed message persistence after a client timeout. Following the addition of a database readiness check to the shared message-creation service, the repeated outage test returned `server_error`, produced no notification during the failed submission, and did not persist the rejected message after recovery.

These results support completion of the tested TP7 backend scenarios. React integration, broader reconnection behavior, and stronger retry/idempotency guarantees remain future work.

## 6. Tech Primer 8 — React Frontend Integration Verification

**Objective:**

Verify that the React frontend integrates with the existing Messenger backend for authentication, authorized conversation access, message history, HTTP and Socket.IO message submission, real-time delivery, message recovery, and conversation-specific authorization.

### Frontend Implementation and Single-User Verification

The React frontend was integrated with the existing Express REST API and Socket.IO server. The interface supports login, authorized conversation listing, message history, message submission using HTTP or Socket.IO, and real-time message updates.

| Test | Result |
|---|---|
| Login through the backend authentication API | PASS |
| JWT maintained in React memory | PASS |
| Authorized conversations displayed | PASS |
| Message history retrieved from the backend | PASS |
| Cursor-based history pagination | PASS |
| Authorized Socket.IO conversation join | PASS |
| HTTP message submission through the frontend | PASS |
| Socket.IO message submission through the frontend | PASS |
| Successful submissions displayed without visible duplicates | PASS |
| Message draft cleared after successful submission | PASS |
| Message draft preserved after a simulated HTTP network failure | PASS |
| Composer state cleared when switching conversations or logging out | PASS |

The frontend uses server-assigned message IDs when merging messages to avoid duplicate display when a Socket.IO notification and a submission response refer to the same message.

### Two-User Real-Time Communication Verification

Two test accounts were registered through the existing authentication API:

- `tp8_member_a`
- `tp8_member_b`

A direct conversation was created through the authenticated conversation API.

**Test Conversation ID:** `6ae63ed9ce63225519631ae6`

User A logged in through a regular Chrome window, while User B logged in through an independent Chrome Incognito window. Both users accessed the same direct conversation with active Socket.IO connections.

| Test | Result |
|---|---|
| Both users authenticated independently | PASS |
| Both users accessed the same authorized conversation | PASS |
| Both Socket.IO connections established | PASS |
| User A submitted a message through HTTP | PASS |
| User B displayed the HTTP-submitted message | PASS |
| User B submitted a message through Socket.IO | PASS |
| User A displayed the Socket.IO-submitted message | PASS |
| Both messages appeared once in each browser | PASS |
| Both connections remained active during the tests | PASS |

The test messages were:

- `tp8 two user HTTP delivery test 1`
- `tp8 two user socket.io delivery test 1`

These results demonstrate bidirectional message delivery between independently authenticated React clients using both supported submission transports.

### Message Persistence and Recovery Verification

After the two-user messaging tests, User A refreshed the browser, logged in again, and reopened the direct conversation.

| Test | Result |
|---|---|
| Authentication required again after page refresh | PASS |
| Socket.IO connection reestablished after login | PASS |
| Previously submitted HTTP message recovered | PASS |
| Previously submitted Socket.IO message recovered | PASS |
| Original sender IDs preserved | PASS |
| No duplicate messages visible after recovery | PASS |

Both messages were retrieved from persisted conversation history rather than relying on the previous browser session's React state.

### Unauthorized Conversation Access Verification

A third test account, `tp8_member_c`, was registered but was not added to the direct conversation.

**Unauthorized User ID:** `6ae64494ce63225519631ae9`

| Test | Result |
|---|---|
| User C authenticated successfully | PASS |
| User C established a Socket.IO connection | PASS |
| Private conversation excluded from User C's conversation list | PASS |
| HTTP message-history request rejected with 404 | PASS |
| Socket.IO `conversation:join` rejected | PASS |

The unauthorized HTTP history request returned:

`404 Not Found — Conversation not found.`

The unauthorized Socket.IO room-join attempt returned:

`{ ok: false, error: "Conversation not found." }`

These results demonstrate that the tested conversation's history and real-time room access are restricted by backend membership checks, not merely hidden by the React interface.

### Frontend Build and Lint Verification

The following commands were executed from the `client` directory:

- `npm run build`
- `npm run lint`

| Check | Result |
|---|---|
| Vite production build | PASS |
| ESLint | PASS |
| Production build modules transformed | 46 |
| Build or lint errors | None reported |

### Additional TP8 Verification — Cursor Pagination

The existing direct conversation was used to test message-history pagination with more than five persisted messages.

**Test Conversation ID:** `6ae63ed9ce63225519631ae6`

| Test | Result |
|---|---|
| Direct conversation contained 10 persisted messages | PASS |
| Older messages displayed through the pagination interface | PASS |
| Messages displayed in chronological order | PASS |
| No visible duplicate messages | PASS |
| Load Older button absent after the end of available history | PASS |

The final browser screenshot showed all 10 messages, including the six additional messages labeled `m1` through `m6`. The exact HTTP cursor-request sequence was not independently captured.

### Additional TP8 Verification — Offline Reconnection and Message Recovery

User A and User B opened the existing direct conversation in independent Chrome sessions. User B's browser network connection was temporarily disabled using Chrome DevTools.

While User B was offline, User A submitted two distinct messages using HTTP:

- `distinct message 1`
- `distinct message 2`

User B's browser was then returned to an online state without refreshing the page or logging in again.

| Test | Result |
|---|---|
| Network interruption simulated using Chrome DevTools | PASS |
| Two messages submitted while User B was offline | PASS |
| Socket.IO connection reestablished | PASS |
| Authorized conversation room rejoined | PASS |
| Both missed messages recovered automatically | PASS |
| Recovered messages displayed once each | PASS |
| Browser returned to live connection status | PASS |

The browser console reported:

```text
Socket.IO reconnected; conversation recovery needed.
Authorized conversation rejoined; recovery controller created.
Recovery scanned 1 page(s) and found 2 messages not previously loaded.
```

This verifies automatic recovery for the tested transient-disconnection scenario without requiring a page refresh.

### Additional TP8 Verification — Group Authorization and Conversation Switching

A three-person group conversation was created through the authenticated conversation API.

**Group Conversation ID:** `6ae656bece63225519631af2`

**Members:**

- `tp8_member_a`
- `tp8_member_b`
- `tp8_member_c`

User C selected the authorized group conversation and submitted the following message using Socket.IO:

`TP8 group message from C`

| Test | Result |
|---|---|
| Group creation through authenticated API | PASS |
| All three members included in group | PASS |
| Group visible to authorized users | PASS |
| User C submitted a group message using Socket.IO | PASS |
| Group message visible to User B | PASS |
| Group message visible to User A | PASS |
| Switching to direct conversation excluded group message | PASS |
| Switching back restored group message history | PASS |
| User C's conversation list excluded the private A–B direct conversation | PASS |

The browser screenshots showed that the group and direct conversation maintained separate message histories. The same group message was visible to authorized members without appearing in the unrelated direct conversation.

### Additional TP8 Verification — Logout and Session Recovery

User B logged out of the React frontend and subsequently logged back in.

| Test | Result |
|---|---|
| Logout returned user to login screen | PASS |
| Authenticated conversations no longer displayed after logout | PASS |
| Previous message history no longer displayed after logout | PASS |
| User B authenticated again successfully | PASS |
| Authorized conversations retrieved after login | PASS |
| Previously persisted group message retrieved | PASS |
| Authorized Socket.IO conversation join returned to live status | PASS |

The React implementation includes Socket.IO cleanup when the authenticated session ends. The screenshots verified the visible logout and recovery behavior, but the underlying socket disconnection was not independently inspected in DevTools.

### Known Limitations and Remaining Verification

- A network failure or Socket.IO acknowledgement timeout does not guarantee that the server rejected the message. Automatic retries are not implemented because they could create duplicate persisted messages.
- Server-side idempotency using client-generated request identifiers remains a potential future improvement.
- Broader automatic reconnection and history synchronization after transient network failures have not been fully verified through the React frontend.
- The TP8 multi-user and unauthorized-user browser checks were performed manually; they are not yet part of an automated frontend acceptance-test suite.
- The existing TP7 integration tests still depend on previously created accounts and conversations.

### TP8 Verification Conclusion

The tested React frontend functionality passed authentication, authorized conversation listing, cursor-based message history, HTTP and Socket.IO message submission, bidirectional real-time delivery, visible message deduplication, and unauthorized conversation-access verification.

Additional browser testing verified automatic recovery of two messages missed during a simulated network outage, pagination across 10 persisted messages, authorized three-person group messaging, direct-to-group conversation switching, message-history isolation, and logout followed by successful reauthentication and persisted-history retrieval.

The frontend production build and ESLint checks passed following the Socket.IO authentication, room-join status, timeout, and recovery-error handling changes.

These results support completion of the principal TP8 frontend integration and browser verification exercises. Expired-token behavior, rejected room-join scenarios, additional reconnection edge cases, automated browser acceptance tests, and exactly-once message creation guarantees remain outside the completed verification scope.

## Final IA-06 Release Verification — November 1, 2026

The completed Messenger MVP was independently verified in the Ubuntu development environment using the repository's release verification script.

### Environment

- Node.js 24 LTS
- MongoDB 7.0 running through Docker Compose
- Existing `messenger-assignment-mongodb-1` container confirmed running and accessible on `127.0.0.1:27017`
- Release verification executed from the repository root using `npm run test:release`

### Verification Results

| Verification | Result |
|---|---|
| Fresh source export | PASS — 60 tracked and nonignored source files exported |
| Fresh dependency installation | PASS |
| Backend unit tests | PASS — 29/29 |
| Frontend helper tests | PASS — 5/5 |
| Isolated API and Socket.IO integration checks | PASS — 19/19 |
| Frontend ESLint | PASS |
| Vite production build | PASS |
| Docker Compose configuration validation | PASS |
| Built-client HTTP connectivity | PASS |
| API proxy and authentication smoke check | PASS |
| Socket.IO transport smoke check | PASS |
| Git ignore checks for secrets, dependencies, build artifacts, and verification output | PASS |
| `git diff --check` | PASS — no whitespace errors |

**Automated test summary:** 53 passed, 0 failed.

Integration testing used a uniquely named disposable database, `messenger_ia06_test_1793572633442_d23e2496`. The release startup check used `messenger_ia06_release_1793572629279_810cfdc9`. Both were retained for inspection. Existing development records were not intentionally modified by these checks.

### Evidence Boundaries

The November 1 release verification used an export of the current uncommitted source. It did not test a final committed clone or verify successful remote submission.

Docker Compose configuration validation passed, and the existing MongoDB container was independently confirmed running. Provisioning MongoDB from scratch in a fresh environment was not performed.

The October 31 automated Firefox acceptance demonstrations reported earlier in this document remain separate browser-level evidence; they were not rerun during the November 1 release verification.

Historical TP8 limitations reflect the state of the project at that time. Subsequent MVP completion added automated browser acceptance coverage, as recorded in the October 31 completion evidence.

Final Git staging, commit, remote pushes, and committed-clone verification remain outstanding at the time of this entry.
