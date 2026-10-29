# Messenger Implementation Verification

## Purpose

This document records the implementation tests performed for the Messenger application, their results, and any known limitations.

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

- Duplicate direct conversation prevention is not yet guaranteed for simultaneous creation requests.
- Conversation creation is implemented, but message storage, history retrieval, and real-time delivery are not yet implemented in the application.

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
