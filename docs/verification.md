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