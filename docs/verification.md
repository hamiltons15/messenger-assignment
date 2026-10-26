# Messenger Implementation Verification

## Purpose

This document records the implementation tests performed for the Messenger application, their results, and any known limitations.

## 1. Accounts and Authentication

The following functionality has been implemented and tested:

- User registration and login.
- Password hashing using bcrypt.
- JWT authentication for protected endpoints.
- Rejection of requests with missing or invalid authentication tokens.

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

## 4. Known Limitations

- Duplicate direct conversation prevention is not yet guaranteed for simultaneous creation requests.
- Conversation creation is implemented, but message storage, history retrieval, and real-time delivery are not yet implemented in the application.

## 5. Verification Status

The implemented authentication and conversation creation functionality has passed the tests recorded above. Additional verification will be completed as development continues.