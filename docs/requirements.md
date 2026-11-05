# Messenger Requirements Engineering

**Project:** Messenger Application
**Student:** Sean Hamilton
**Course:** CPS 490 - Capstone I
**Document Status:** Revised for IA-06 MVP
**Original Submission Date:** October 12, 2026
**Last Revised:** November 5, 2026

---

## Revision History

| Date | Revision | Description |
|---|---|---|
| October 12, 2026 | Initial Requirements | Established functional and nonfunctional requirements, acceptance criteria, assumptions, unresolved questions, and traceability. |
| October 19, 2026 | IA-06 Requirements Revision | Aligned the requirements with the IA-06 technology stack, authentication, authorization, persistent messaging, real-time delivery, reliability, and reproducible execution. |
| October 22-29, 2026 | Implementation Decisions | Documented registration validation, authentication, conversation creation, group membership permissions, message history, and direct-conversation uniqueness decisions. The October 22 authentication decision initially specified a one-hour JWT expiration; the final implemented policy is eight hours. |
| October 31, 2026 | MVP Scope Reconciliation | Established the approved IA-06 MVP scope, distinguished implemented backend functionality from deferred browser features, and reconciled authentication and messaging decisions. |
| November 4-5, 2026 | Final Implementation and Verification Updates | Documented Socket.IO-only browser message submission, automatic conversation discovery notifications, direct-conversation uniqueness verification, and the latest automated release verification results. |

---

## IA-06 MVP Scope and Requirements Interpretation

The requirements in this document describe the Messenger application and its intended functionality. The original functional requirements, acceptance criteria, nonfunctional requirements, and design-decision identifiers are retained to preserve traceability throughout the project.

For the IA-06 implementation, the project owner approved a minimum viable product (MVP) scope on October 31, 2026. This scope preserves the required registration, authentication, direct messaging, group messaging, persistence, authorization, real-time communication, error handling, and reproducible local execution capabilities.

Some functionality described in the original requirements remains part of the broader product scope but was explicitly deferred from the browser-based MVP. These deferrals do not remove existing backend functionality or change the security requirements.

Deferred browser features are not considered implemented or verified MVP acceptance criteria. The existence of a corresponding backend API does not establish completion of the deferred browser functionality. No mandatory IA-06 behavior is deferred.

### Approved MVP Scope

| Requirement | MVP disposition |
|---|---|
| FR-01, FR-02, FR-03, FR-05, FR-09, FR-10, FR-11, FR-12; NFR-01, NFR-03, NFR-04, NFR-05 | Required MVP functionality, including account management, messaging, conversation discovery, authorization, persistence, real-time delivery, reliability, and reproducible execution. |
| FR-04 / AC-04 | Group creation is required. Existing creator-only membership-management APIs are retained; browser controls for adding and removing members are deferred. |
| FR-06 / AC-06 / UQ-06 | Sender-only message editing and soft deletion remain implemented through backend APIs. Browser edit/delete controls are deferred. |
| FR-07 / AC-07 | Transient in-app message activity notifications are implemented. Persistent unread tracking and unread counts are deferred. |
| FR-08 / AC-08 / UQ-07 | Current account identification is implemented. Profile modification is deferred. |
| UQ-09 | Message timestamps, submission feedback, and recovery behavior remain in scope. Delivered/Read indicators and automatic write retries are not included. |
| UQ-05 | Voluntary group leaving remains unresolved future functionality. |
| NFR-02 | The approved MVP interpretation governs the release scope while preserving the required technology stack and existing APIs. |

The approved deferrals do not weaken authentication, authorization, conversation membership enforcement, or persistence requirements. Implemented backend operations retain their established security rules.

### Final Implementation Clarifications

The browser submits new messages through Socket.IO. The existing HTTP message API remains available for compatibility and verification.

When a direct or group conversation is successfully created and persisted, the backend emits `conversation:created` notifications to the authenticated participants' user rooms. Connected clients refresh their authorized conversation lists, allowing newly created conversations to appear without requiring a manual refresh.

Direct-conversation uniqueness is enforced through the established canonical participant key and database uniqueness constraint. Duplicate creation attempts do not create an additional direct conversation.

Conversation creation accepts either legacy member identifiers or a list of usernames, but not both in the same request. When usernames are supplied, the list identifies other registered users, and the backend automatically includes the authenticated creator. Usernames are resolved case-insensitively. The backend enforces the established participant-count, membership, and direct-conversation uniqueness rules. Optional group names are limited to 80 characters. The browser identifies conversation participants by username without exposing password hashes.

JWTs expire after eight hours. The browser holds its JWT in memory and discards it on logout; logout does not revoke an independently retained token on the server.

The detailed requirements, acceptance criteria, and design decisions in the following sections define these behaviors and distinguish implemented MVP functionality from deferred features.

---

## 1. System Context

Messenger is a browser based communication application that allows registered users to exchange private messages and participate in group conversations. The Messenger system is responsible for managing user accounts, authentication, private messaging, group conversations, group membership, message history, message editing and deletion, real time communication, notifications, and basic user profiles.

Users will create their own accounts and authenticate before accessing protected messaging functionality. Messenger will verify user identities and enforce conversation membership restrictions to ensure that messages and conversation data are accessible only to authorized participants. User accounts, conversations, and messages will be stored persistently so that information remains available after users log out or the backend restarts.

The application will be implemented using the technologies required by IA-06, including Node.js, Express, MongoDB, Mongoose, React, Vite, bcrypt, JWT, and Socket.IO. The system will operate through a browser interface, with Docker Compose supporting the local database environment. Dedicated mobile applications, external application integrations, voice and video calling, screen sharing, and advanced moderation capabilities remain outside the system boundary.

### 1.1 Major Actors

**User:** A person who creates and accesses a registered Messenger account. Users interact with Messenger to send and receive private messages, participate in group conversations, manage group membership according to their permissions, access message history, edit or delete messages they previously sent, receive notifications, and maintain their basic profiles.

Users must authenticate before accessing protected conversations and messaging operations. Their ability to view, send, or manage messages within a conversation depends on their verified identity and the applicable authorization rules.

### 1.2 External Systems

No external application or third party service integration is required for Messenger. Account registration and authentication will be handled within the application rather than relying on an external identity provider.

Messenger will use MongoDB for persistent storage of user accounts, conversations, and messages. Docker Compose will manage the local database service during development, testing, and demonstration.

Real time message delivery and notifications will be supported through Socket.IO communication between the Messenger backend and browser interface. The specific notification behavior will be established in the functional requirements and resolved design decisions before implementation.


## 2. Functional Requirements

### FR-01 - User Registration and Identification

The Messenger system shall allow a person to register a user account by providing the required registration information. Each successfully registered account shall have a unique user ID and an associated basic profile.

The system shall prevent the creation of accounts that violate the established uniqueness requirements and shall reject registration requests that do not satisfy the required input validation rules.

**Source:** Statement of Work, Section 3.1, User Registration and Authentication; IA-06, Account Requirements.


### FR-02 - Private Messaging

The Messenger system shall allow an authenticated user to create or access a private conversation with another registered user and send messages within that conversation.

The system shall make messages available to the intended conversation participants and shall prevent unintended duplicate private conversations between the same two users.

The system shall verify that the authenticated sender is an authorized participant before allowing a message to be sent or retrieved from a private conversation.

**Source:** Statement of Work, Section 3.1, Private Messaging and Authorization and Conversation Privacy; IA-06, Direct Conversation and Messaging Requirements.


### FR-03 - Group Messaging

The Messenger system shall allow authenticated users to participate in group conversations containing multiple registered users and exchange messages with other members of those conversations.

The system shall make messages sent within a group conversation available to its authorized members and shall verify that a user is a permitted participant before allowing the user to send or retrieve group messages.

Group messages shall be associated with the correct conversation and sender so that authorized members can access the conversation's message history.

**Source:** Statement of Work, Section 3.1, Group Messaging and Authorization and Conversation Privacy; IA-06, Group Conversation and Messaging Requirements.


### FR-04 - Group Management

**Release status: group creation is mandatory; existing membership APIs are preserved. Browser member-management controls are deferred as approved above.**

The Messenger system shall allow authenticated users to create group conversations containing multiple registered users.

The system shall allow authorized users to add registered users to an existing group conversation and remove members from a group conversation according to the established group membership permissions.

The system shall accurately maintain and display the current membership of a group after a membership change. Group creation and membership changes shall be stored persistently so that the updated group membership remains available after users log out or the backend restarts.

The system shall verify the authenticated user's permissions before allowing group membership changes and shall enforce the updated membership restrictions when users attempt to access group conversations or messages.

**Source:** Statement of Work, Section 3.1, Group Messaging, Group Management, and Authorization and Conversation Privacy; IA-06, Group Conversation and Authorization Requirements.


### FR-05 - Message History

The Messenger system shall allow authenticated users to access their previous private and group conversations and retrieve messages associated with those conversations.

The system shall store messages persistently in MongoDB, including the conversation to which each message belongs, the sender's identity, the message content, and the information necessary to maintain a consistent message order.

When an authorized user opens or returns to a conversation, the system shall retrieve and display the stored messages in a consistent order. Message history shall remain available after users log out and log back in or after the backend restarts.

The system shall allow authorized users to retrieve messages sent while they were disconnected or not actively using Messenger. Access to stored messages shall follow the conversation membership and authorization rules established for the application.

**Source:** Statement of Work, Section 3.1, Message History and Persistence and Authorization and Conversation Privacy; IA-06, Message Persistence and Offline Recovery Requirements.


### FR-06 - Message Editing and Deletion

**Release status: backend behavior is preserved; browser controls are an approved deferral. The full-product browser requirement below is not claimed complete.**

The Messenger system shall allow authenticated users to edit or delete messages they have previously sent within private and group conversations.

When a user edits a message, the system shall update the stored message content and display the updated content in the correct conversation.

When a user deletes a message, the system shall update the stored conversation data according to the established message deletion behavior so that the deleted message is no longer displayed as an active message in the conversation.

The system shall verify the authenticated user's identity and confirm that the user is the original sender before allowing a message to be edited or deleted. Attempts to edit or delete messages belonging to another user shall be rejected.

Message edits and deletions shall be stored persistently so that the resulting changes remain reflected in the conversation after users log out or the backend restarts.

**Source:** Statement of Work, Section 3.1, Message Editing and Deletion and Authorization and Conversation Privacy.


### FR-07 - Message Notifications

**Release status: transient in-app activity notices are in scope. Persistent unread tracking/counts are deferred. FR-11 live display remains mandatory.**

The Messenger system shall provide notifications within the browser interface when an authenticated user receives a new private or group message.

When a new private message is received, the system shall notify the intended recipient. When a new group message is received, the system shall notify the applicable authorized group members.

Notifications shall be associated with the correct conversation and shall not disclose message information to users who are not authorized participants.

The system shall use its real time communication capabilities to support notifications for connected users. The specific notification presentation and behavior will be established before implementation.

**Source:** Statement of Work, Section 3.1, Real Time Messaging and Notifications and Authorization and Conversation Privacy.


### FR-08 - User Profiles

**Release status: current account identification is in scope; profile modification and its acceptance tests below are deferred future scope.**

The Messenger system shall allow authenticated users to access and view the basic profile information associated with their registered accounts.

The system shall allow users to modify their permitted profile information and shall validate the submitted changes before updating the stored profile.

The system shall associate each profile with the correct registered user account and persist authorized profile changes so that updated information remains available after users log out or the backend restarts.

The system shall verify the authenticated user's identity before allowing profile modifications and shall prevent users from modifying another user's profile information without authorization.

**Source:** Statement of Work, Section 3.1, User Profiles and User Registration and Authentication.


### FR-09 - Conversation Access Control

The Messenger system shall restrict access to private and group conversations, stored messages, and protected messaging operations to authenticated users who are authorized participants in the applicable conversation.

The system shall verify the user's identity through a valid authenticated session and enforce conversation membership restrictions on the backend for both HTTP requests and Socket.IO events.

For private conversations, the system shall allow only the intended participants to retrieve messages, send messages, and receive real time conversation events.

For group conversations, the system shall allow only authorized members to retrieve messages, send messages, and subscribe to real time conversation events. Access to group message history shall follow the established membership and history access rules.

The system shall reject unauthorized attempts to access conversations, retrieve messages, send messages, modify protected conversation data, or subscribe to conversation events. Authorization decisions shall be based on verified user identity and stored conversation membership information rather than user identifiers or membership claims supplied by the browser.

**Source:** Ethics Reflection, Section 3.1, Unauthorized Access to Conversations; Statement of Work, Section 3.1, Authorization and Conversation Privacy; IA-06, HTTP and Socket.IO Authorization Requirements.

### FR-10 - User Authentication and Session Management

The Messenger system shall allow registered users to log in using their account credentials and shall verify the submitted credentials before granting authenticated access.

The system shall securely hash user passwords using bcrypt before storing them and shall verify submitted passwords against the stored hashes during login. Passwords shall not be stored in plain text.

After successful authentication, the system shall issue a JSON Web Token (JWT) that identifies the authenticated user. The system shall verify the JWT before allowing access to protected application operations.

The system shall allow authenticated users to retrieve their current account information based on their verified identity rather than relying on a user identifier supplied by the browser.

The system shall provide a logout operation that ends the user's authenticated session within the application. After logout, the browser shall no longer use the previous session credentials to access protected functionality.

The system shall reject login attempts with invalid credentials and protected requests containing missing, invalid, or expired authentication tokens.

**Source:** Statement of Work, Section 3.1, User Registration and Authentication; IA-06, Account Registration, Authentication, and Session Requirements.

### FR-11 - Real-Time Message Delivery

The Messenger system shall allow authenticated users to receive new private and group messages in real time through Socket.IO without manually refreshing the browser interface.

When an authenticated user sends a message, the system shall validate the request, verify the sender's conversation membership, and successfully store the message in MongoDB before emitting a real time delivery event to the authorized conversation participants.

The browser interface shall submit new messages through authenticated Socket.IO events. The backend may retain an authenticated HTTP message-creation endpoint for compatibility and verification, subject to the same persistence and authorization requirements.

The system shall associate each real time message event with the correct conversation and shall deliver the event only to users authorized to participate in that conversation.

The system shall verify user authentication when establishing protected Socket.IO connections and shall enforce conversation membership restrictions before allowing users to subscribe to conversation events.

When a user is disconnected or not actively using Messenger, the system shall preserve messages in persistent storage so that the user can retrieve missed messages through the conversation history after reconnecting.

**Source:** Statement of Work, Section 3.1, Real Time Messaging and Notifications, Message History and Persistence, and Authorization and Conversation Privacy; IA-06, Real-Time Delivery and Socket.IO Authorization Requirements.

### FR-12 - Conversation Discovery and Listing

The Messenger system shall allow authenticated users to retrieve and view a list of the private and group conversations in which they are authorized participants.

The system shall identify the conversations associated with the authenticated user and provide the information necessary for the user to distinguish between and access their available conversations.

The system shall retrieve conversation membership information from persistent storage and shall exclude conversations in which the authenticated user is not an authorized participant.

When a user creates a new conversation or an authorized membership change occurs, the system shall reflect the updated conversation membership when the user's conversation list is retrieved.

After successfully persisting a new direct or group conversation, the backend shall notify its authenticated participants through Socket.IO. Connected browser clients shall respond by refreshing their authorized conversation lists, allowing newly created conversations to become visible without manual refresh. The notification shall identify the conversation without replacing backend membership authorization.

The system shall determine the requesting user's identity through their verified authenticated session rather than relying on a user identifier supplied by the browser.

**Source:** Statement of Work, Section 3.1, Private Messaging, Group Messaging, Message History and Persistence, and Authorization and Conversation Privacy; IA-06, Conversation Listing and Membership Requirements.


## 3. Non-Functional Requirements

### NFR-01 - Authentication and Security Constraint

The Messenger system shall protect user accounts and messaging operations through authenticated access and server side authorization.

The system shall use bcrypt to securely hash user passwords before storing them and shall not store passwords in plain text. Protected application operations shall require a valid JSON Web Token (JWT), and the backend shall determine the acting user's identity from the verified token.

The system shall enforce conversation membership authorization for both HTTP requests and Socket.IO events. Users shall not be permitted to access protected conversation information or perform messaging operations without the required authentication and authorization.

The system shall reject unauthorized requests without disclosing protected account or conversation information.

**Source:** Statement of Work, Sections 3.1 and 5.2, User Registration and Authentication and Authentication and Authorization; IA-06, Authentication and Security Requirements.

### NFR-02 - Prototype Scope Constraint

The Messenger system shall be developed as a browser based application that can be executed and evaluated in a local development environment.

The implementation shall use React with Vite for the frontend, Node.js 24 LTS with Express for the backend, MongoDB with Mongoose for persistent storage, and Socket.IO for real time communication. MongoDB shall be available through Docker Compose as required by the implementation environment.

The system shall support the messaging, account management, group management, message history, message editing and deletion, notifications, and user profile functionality defined in the approved functional requirements.

The system shall not be required to provide a dedicated mobile application, external messaging integrations, end to end encryption, voice or video calling, screen sharing, or advanced administrative and moderation capabilities.

The system shall not require deployment to a publicly hosted production environment to satisfy the project scope.

**Source:** Statement of Work, Sections 3.1 and 3.2, In Scope and Out of Scope; IA-06, Required Technology Stack and Local Execution Requirements.

### NFR-03 - Message Persistence

The Messenger system shall persist conversation messages in MongoDB so that message history remains available independently of the user's current browser session or the backend application's running state.

The system shall store each message with the information necessary to identify its associated conversation, sender, content, and ordering within the conversation.

Messages shall remain available to authorized conversation participants after navigating away from a conversation, logging out and logging back in, or restarting the backend application.

The system shall preserve messages sent while an authorized recipient is disconnected and shall allow that recipient to retrieve the missed messages through conversation history after reconnecting.

The system shall successfully persist a new message before reporting successful message submission or emitting its real time delivery event.

The system shall enforce the established conversation access control and group message history rules when retrieving persisted messages.

**Source:** Statement of Work, Section 3.1, Message History and Persistence; IA-06, Persistent Message Storage, Offline Recovery, and Real-Time Delivery Requirements.

### NFR-04 - Application Reliability and Error Handling

The Messenger system shall handle invalid user input, failed requests, and unavailable backend services without presenting unsuccessful operations as completed successfully.

The system shall provide appropriate feedback when an operation cannot be completed, including account registration, login, conversation creation, message submission, and authorized message modifications.

The browser interface shall communicate relevant loading, empty, validation error, and backend failure states so that users can distinguish between operations that are pending, completed, or unsuccessful.

The system shall prevent unintended duplicate submissions caused by repeated user interactions while an operation is pending.

The backend shall validate incoming requests and return appropriate failure responses without exposing protected account information, conversation data, or sensitive implementation details.

A failed operation shall not incorrectly modify persistent application data or produce a successful real time event.

**Source:** Statement of Work, Section 3.1, User Interface and Application Reliability; IA-06, User Interface States, Validation, Failure Handling, and Duplicate Submission Requirements

### NFR-05 - Reproducible Local Execution

The Messenger system shall support reproducible setup and execution in a local development environment using the technologies and dependencies specified by the project.

The system shall use Node.js 24 LTS for the application runtime and Docker Compose to provide the MongoDB database environment.

The project repository shall include the dependency definitions, configuration templates, and setup instructions necessary to install, configure, start, and test the application from a clean repository checkout.

The system shall use environment based configuration for settings that may differ between development environments. The repository shall provide an example environment configuration without including actual passwords, authentication secrets, or other sensitive credentials.

The project shall exclude installed dependencies, generated build artifacts, local environment files containing secrets, and other machine specific files that are not required for reproducing the application.

The system shall not require deployment to an externally hosted production environment to demonstrate its required functionality.

**Source:** Statement of Work, Sections 3.1 and 3.2, Implementation Scope and Project Constraints; IA-06, Required Technology Stack, Docker Compose, Repository Contents, and Reproducible Setup Requirements.

## 4. Acceptance Criteria

### AC-01 - User Registration and Identification

**Related Requirement:** FR-01

**Acceptance Criteria:**

1. A new user can register an account by providing the required registration information through the Messenger application.

2. The system validates the submitted registration information and rejects requests that do not satisfy the established registration requirements.

3. The system prevents the creation of multiple accounts using an account identifier that is required to be unique.

4. After successful registration, the system creates a persistent user account with a unique identifier and the associated basic profile information.

5. The registered account remains available after the user logs out or the backend application restarts.

6. The system provides appropriate feedback when registration succeeds or fails.

**Verification Method:** Demonstration and automated testing using valid registration information, invalid registration information, duplicate account identifiers, and account retrieval after a backend restart.


### AC-02 - Private Messaging

**Related Requirement:** FR-02

**Acceptance Criteria:**

1. An authenticated user can initiate a private conversation with another registered user.

2. The system creates a direct conversation associated with the two intended participants and stores the conversation information persistently.

3. When a direct conversation already exists between the same two participants, the system allows the users to access the existing conversation rather than unintentionally creating a duplicate.

4. Either authorized participant can send a message within the private conversation, and the system associates the message with the correct conversation and authenticated sender.

5. Both authorized participants can retrieve and view the messages associated with their private conversation.

6. A user who is not an authorized participant cannot retrieve messages from or send messages to the private conversation.

7. The private conversation and its stored messages remain available to the authorized participants after logging out and logging back in.

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify direct conversation creation, duplicate prevention, message exchange, persistent storage, and rejection of unauthorized access attempts.


### AC-03 - Group Messaging

**Related Requirement:** FR-03

**Acceptance Criteria:**

1. An authenticated user who is an authorized member of a group conversation can access that conversation through the Messenger application.

2. An authorized group member can send a message to the group conversation.

3. The authenticated creator is included in a group containing at least three distinct registered users. Direct-conversation duplicate behavior belongs to AC-02 and UQ-11; it is not a group criterion.

4. Other authorized group members can retrieve and view messages sent within the group conversation.

5. The system displays group messages in the correct conversation and in their established message order.

6. A user who is not an authorized member of the group cannot retrieve group messages or send messages to the group conversation.

7. Group messages remain available to authorized members after navigating away from the conversation, logging out and logging back in, or restarting the backend application.

8. Access to historical group messages follows the established group membership and message history access rules.

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify group message submission, message retrieval, sender identification, message ordering, persistence, and rejection of unauthorized access attempts.


### AC-04 - Group Management

**Related Requirement:** FR-04

**Acceptance Criteria:**

1. An authenticated user can create a group conversation with the required group information and initial members.

2. The system stores the newly created group conversation and its membership information persistently.

3. An authorized user can add registered users to an existing group conversation according to the established group membership permissions.

4. An authorized user can remove members from an existing group conversation according to the established group membership permissions.

5. The system validates group membership changes and rejects requests submitted by users who do not have the required permissions.

6. Successful group membership changes are stored persistently and remain available after the backend application restarts.

7. After a user is added to a group, the system recognizes that user's membership and permits access to the group's authorized functionality according to the established message history access rules.

8. After a user is removed from a group, the system prevents that user from accessing protected group operations and receiving subsequent protected group events.

9. The system reflects updated group membership information when authorized users retrieve the group conversation or its membership information.

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify group creation, member additions and removals, permission enforcement, membership persistence, and rejection of unauthorized operations.


### AC-05 - Message History

**Related Requirements:** FR-05, NFR-03

**Acceptance Criteria:**

1. An authenticated user can retrieve the stored message history of a private or group conversation in which they are authorized to participate.

2. The system retrieves messages from MongoDB and associates each message with the correct conversation, authenticated sender, and message content.

3. The system returns messages in their established conversation order so that users can view the conversation history correctly.

4. Message history remains available to authorized users after navigating away from a conversation and returning to it.

5. Message history remains available after an authorized user logs out and logs back in.

6. Previously stored messages remain available after the Express backend application is stopped and restarted while the persistent MongoDB data is preserved.

7. Messages sent while an authorized recipient is disconnected remain stored and can be retrieved through conversation history after that recipient reconnects.

8. The system rejects attempts by unauthorized users to retrieve protected conversation history.

9. The system does not report a new message as successfully submitted or emit its successful real time delivery event when the message cannot be persisted.

10. Access to historical group messages follows the established group membership and message history access rules.

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify message retrieval, sender and conversation association, message ordering, persistence across logout and backend restart, offline recovery, rejection of unauthorized history requests, and handling of failed database writes.


### AC-06 - Message Editing and Deletion

**Related Requirement:** FR-06

**Acceptance Criteria:**

1. An authenticated user can edit a message they originally sent within a conversation they are authorized to access.

2. The system validates the edited message content and rejects changes that do not satisfy the established message requirements.

3. A successful message edit updates the stored message in MongoDB while preserving its association with the original sender and conversation.

4. An authenticated user can delete a message they originally sent within a conversation they are authorized to access.

5. The system applies the established message deletion behavior and persists the resulting change in MongoDB.

6. The system prevents users from editing or deleting messages originally sent by another user.

7. The backend verifies the authenticated user's identity, current conversation authorization, and message ownership before permitting an edit or deletion.

8. Successfully edited or deleted messages reflect the updated stored state when authorized users retrieve the conversation history, including after logging out and logging back in or restarting the backend application.

9. Failed or unauthorized edit and deletion attempts do not modify the stored message.

10. Message editing and deletion follow the established rules for editing restrictions, deletion representation, and notification of changes to other conversation participants.

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify authorized message edits and deletions, content validation, sender ownership, conversation authorization, persistent changes, and rejection of unauthorized modifications.


### AC-07 - Message Notifications

**Related Requirement:** FR-07

**Acceptance Criteria:**

1. An authenticated user can receive an in-app notification when a new message is sent to a private or group conversation in which they are an authorized participant.

2. The system generates message notifications through Socket.IO for connected users who are authorized to receive the corresponding conversation information.

3. Notifications are associated with the correct conversation so that users can identify the conversation in which a new message was received.

4. The system restricts notification events and their contents to users who are authorized to access the corresponding conversation.

5. A user who is not an authorized participant in a conversation does not receive notifications containing protected information from that conversation.

6. The system applies current group membership restrictions when determining which users are authorized to receive notifications.

7. Notification behavior follows the established rules for notification presentation, including how notifications appear when a conversation is already open or when the user is viewing another conversation.

**Verification Method:** Demonstration and automated testing using multiple authenticated accounts and Socket.IO connections to verify notification delivery, correct conversation association, group membership restrictions, and prevention of unauthorized notification access.


### AC-08 - User Profiles

**Related Requirement:** FR-08

**Acceptance Criteria:**

1. An authenticated user can access and view the basic profile information associated with their registered account.

2. The system retrieves the user's profile information from the correct registered account in persistent storage.

3. An authenticated user can modify their permitted profile information through the Messenger application.

4. The system validates submitted profile changes and rejects updates that do not satisfy the established profile requirements.

5. Successfully updated profile information is stored in MongoDB and remains associated with the correct registered user account.

6. Updated profile information remains available after the user logs out and logs back in or the backend application restarts.

7. The system verifies the authenticated user's identity before allowing profile modifications.

8. A user cannot modify another user's profile information without authorization.

9. Failed or unauthorized profile update attempts do not modify the stored profile information.

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify profile retrieval, authorized modifications, input validation, persistent updates, and rejection of unauthorized changes.


### AC-09 - Conversation Access Control

**Related Requirement:** FR-09

**Acceptance Criteria:**

1. The system requires valid authentication before allowing users to access protected private or group conversation information and messaging operations.

2. The backend determines the acting user's identity from a verified JWT rather than trusting a user identifier supplied by the browser.

3. An authenticated user can retrieve messages and perform permitted messaging operations only within conversations in which they are an authorized participant.

4. The system rejects HTTP requests attempting to retrieve messages, send messages, or modify protected conversation information when the authenticated user does not have the required authorization.

5. The system authenticates Socket.IO connections and verifies conversation membership before allowing users to join or subscribe to protected conversation events.

6. A user who is not an authorized conversation participant cannot receive protected messages or conversation events through Socket.IO.

7. The system prevents users from bypassing authorization by supplying another user's identifier, modifying a conversation identifier, or manipulating membership information in a request.

8. When a user's group membership is removed, the system prevents that user from performing subsequent protected group operations or receiving subsequent protected group events.

9. The system applies the established group membership and message history access rules when determining whether a user can retrieve historical group messages.

10. Unauthorized requests are rejected without disclosing protected conversation content or other information that the requesting user is not permitted to access.

**Verification Method:** Automated positive and negative testing using multiple authenticated accounts, direct HTTP requests, and Socket.IO connections to verify authorized access, rejection of unauthorized operations, prevention of identity spoofing, and enforcement of current group membership restrictions.

### AC-10 - User Authentication and Session Management

**Related Requirements:** FR-10, NFR-01

**Acceptance Criteria:**

1. A registered user can log in to Messenger using valid account credentials.

2. The system rejects login attempts containing incorrect or invalid credentials without granting authenticated access.

3. The system stores user passwords as bcrypt hashes rather than plain text and verifies submitted passwords against the stored hashes during login.

4. After successful login, the system issues a valid JSON Web Token (JWT) associated with the authenticated user.

5. The system verifies the JWT before allowing access to protected application operations.

6. An authenticated user can retrieve their current account information, and the backend identifies the user through the verified JWT rather than a user identifier supplied by the browser.

7. The system rejects protected requests containing missing, invalid, or expired authentication tokens.

8. An authenticated user can log out of Messenger, and the application removes the authentication credentials used by that browser session.

9. After logout, the browser can no longer access protected application functionality using the ended session unless the user authenticates again.

10. The system provides appropriate feedback when authentication succeeds or fails without exposing passwords, authentication secrets, or other protected account information.

**Verification Method:** Demonstration and automated testing using registered accounts, valid and invalid credentials, password storage inspection, JWT verification, expired or invalid tokens, current user identification, and logout behavior.

### AC-11 - Real-Time Message Delivery

**Related Requirements:** FR-11, FR-09, NFR-03

**Acceptance Criteria:**

1. When an authenticated user sends a message to a private conversation, another authorized participant who is connected to Messenger receives the new message through Socket.IO without manually refreshing the browser.

2. When an authenticated user sends a message to a group conversation, connected and authorized group members receive the new message through Socket.IO without manually refreshing the browser.

3. The system associates each real time message event with the correct conversation, authenticated sender, and stored message.

4. The backend successfully persists a new message in MongoDB before emitting its real time delivery event.

5. If the message cannot be stored successfully, the system does not emit a successful message delivery event or report the message as successfully submitted.

6. The system authenticates Socket.IO connections and verifies conversation membership before allowing users to join or subscribe to protected conversation events.

7. A user who is not an authorized conversation participant cannot subscribe to or receive protected real time message events for that conversation.

8. When a user is removed from a group conversation, the system prevents that user from receiving subsequent protected real time events from the group.

9. Messages sent while an authorized recipient is disconnected remain available in persistent storage and can be retrieved through conversation history after the recipient reconnects.

10. A temporary disconnection does not cause previously stored messages to be lost.

11. The browser submits new messages through Socket.IO, and the backend applies the established authentication, membership, validation, and persistence-before-broadcast rules.

**Verification Method:** Demonstration and automated testing using multiple authenticated browser sessions, Socket.IO clients, authorized and unauthorized conversation participants, simulated database failures, and temporary client disconnections to verify real time delivery, persistence before broadcasting, access control, and offline recovery.

### AC-12 - Conversation Discovery and Listing

**Related Requirement:** FR-12

**Acceptance Criteria:**

1. An authenticated user can retrieve and view a list of the private and group conversations in which they are authorized participants.

2. The system retrieves conversation information from persistent storage and associates each conversation with the correct authenticated user and stored membership information.

3. The conversation list provides sufficient information for the user to distinguish between available conversations and access a selected conversation.

4. The system excludes private and group conversations in which the authenticated user is not an authorized participant.

5. When an authenticated user creates a new private or group conversation, the conversation appears in the appropriate authorized users' conversation lists when those lists are retrieved.

6. When a user is added to a group conversation, the group becomes available in that user's conversation list according to the established membership rules.

7. When a user is removed from a group conversation, the group no longer appears as an accessible conversation in that user's retrieved conversation list.

8. The backend determines which conversations to return based on the user's verified authentication information rather than a user identifier supplied by the browser.

9. The system rejects unauthenticated requests to retrieve protected conversation lists.

10. Conversation lists reflect the stored conversation and membership information after the backend application restarts.

11. When a new direct or group conversation is successfully persisted, connected authorized participants receive a Socket.IO conversation-creation notification and automatically refresh their conversation lists without manually refreshing the browser.

12. Users who are not participants do not receive the protected conversation-creation notification. A rejected duplicate direct-conversation creation does not generate a new-conversation notification.

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify authorized conversation listing, private and group conversation visibility, conversation creation, membership changes, persistent conversation information, participant notifications and automatic list refresh, outsider exclusion, rejected duplicate direct-conversation notifications, and rejection of unauthorized requests.

### AC-13 - Application Reliability and Error Handling

**Related Requirement:** NFR-04

**Acceptance Criteria:**

1. The Messenger application displays appropriate loading feedback while retrieving data or processing operations that have not yet completed.

2. The application displays an appropriate empty state when a user has no conversations or when an authorized conversation contains no messages.

3. The system validates required user input and provides appropriate feedback when registration, login, conversation creation, message submission, or other supported operations contain invalid information.

4. The backend independently validates incoming requests and rejects invalid operations even when frontend validation is bypassed.

5. When an operation fails because of a backend or database error, the application communicates the failure without presenting the operation as successfully completed.

6. The application prevents unintended duplicate submissions caused by repeated user interactions while an operation is pending.

7. Failed message submissions do not produce successful real time message delivery events.

8. Failed or unauthorized operations do not incorrectly modify persistent application data.

9. Backend error responses do not expose passwords, authentication secrets, protected conversation information, or sensitive implementation details.

10. After a recoverable failure, the application allows the user to retry the operation when the required services become available.

**Verification Method:** Demonstration and automated testing using invalid inputs, empty conversations, delayed requests, repeated submission attempts, simulated backend and database failures, and unauthorized requests to verify appropriate interface states, validation, failure handling, and data protection.

### AC-14 - Reproducible Local Execution

**Related Requirements:** NFR-05, NFR-02

**Acceptance Criteria:**

1. The Messenger project can be obtained from a clean GitHub repository checkout containing the application source code, dependency definitions, configuration templates, and required documentation.

2. The project can be configured and executed in a local development environment using Node.js 24 LTS and the required application technologies.

3. The repository includes the dependency definitions and documented commands necessary to install the React frontend and Express backend dependencies.

4. The repository includes a Docker Compose configuration that allows MongoDB to be started for local application execution.

5. The repository includes an `.env.example` file documenting the required environment variables without exposing actual passwords, authentication secrets, or other sensitive credentials.

6. The README provides sufficient instructions to configure the environment, install dependencies, start MongoDB, launch the frontend and backend, and access the running application.

7. The README documents how to execute the project's automated tests and provides troubleshooting guidance for common setup or execution problems.

8. After following the documented setup instructions, the application can connect to MongoDB and perform its required account and messaging operations.

9. The repository excludes local environment files containing secrets, installed dependencies, generated build artifacts, and other machine specific files that are not required for reproducing the application.

10. The required functionality can be demonstrated in the local development environment without deploying the application to a publicly hosted production server.

**Verification Method:** Clean checkout demonstration and repository inspection to verify documented installation, environment configuration, Docker Compose startup, application execution, database connectivity, automated test execution, and exclusion of sensitive or unnecessary files.


## 5. Assumptions and Unresolved Questions

### 5.1 Assumptions

#### A-01 - User Account Management

The Messenger system is assumed to manage its own registered user accounts within the application rather than relying on an external identity provider or an existing user directory.

Users will create accounts through the Messenger registration functionality and authenticate using the credentials associated with those accounts. Account information will be stored in MongoDB, and authenticated access will be established through the JWT based authentication mechanism required by IA-06.

The application is assumed to operate in a local development and evaluation environment using registered test accounts. Integration with external account management systems, institutional authentication services, or third party identity providers is not required.

**Source:** Statement of Work, Sections 3.1 and 3.2, User Registration and Authentication and Out of Scope; IA-06, Account Registration and Authentication Requirements.


### 5.2 Unresolved Questions

#### UQ-01 - User Identity and Authentication Method

**Status:** Resolved

**Question:** How will the Messenger system establish user identities and authenticate users without relying on an external identity provider?

**Resolution:** The Messenger system will manage registered user accounts internally. Users will create accounts through the application's registration functionality and authenticate using their registered credentials.

The system will store user account information in MongoDB and securely hash passwords using bcrypt. Following successful login, the backend will issue a JSON Web Token (JWT) that identifies the authenticated user.

The backend will verify the JWT for protected operations and determine the acting user's identity from the verified token rather than trusting user identifiers supplied by the browser.

External identity providers and existing institutional account directories are not required for the Messenger implementation.

**Related Requirements:** FR-01, FR-09, FR-10, NFR-01, A-01

**Resolution Source:** IA-06, Account Registration and Authentication Requirements; Statement of Work, Section 3.1, User Registration and Authentication.


#### UQ-02 - Notification Method and Behavior

**Status:** Resolved for the IA-06 MVP; persistent unread tracking deferred.

**Question:** How will Messenger notify authenticated users about new private and group messages?

**Resolution:**

Messenger provides transient in-app notifications through Socket.IO to connected, authorized conversation participants.

When another user sends a successfully persisted message, the application displays a notification identifying the associated conversation. Notifications are supported whether the recipient is viewing that conversation or another conversation.

The backend checks current conversation membership before sending notification activity to authenticated user rooms. Users who are not authorized participants must not receive protected notification information.

The browser retains only the latest notification in component memory. Notifications are cleared when the associated conversation is selected or the user logs out.

Persistent unread counts, read-position tracking, notification history, and notification replay are deferred from the IA-06 MVP. External email, push, and operating-system notifications are not required.

**Related Requirements:** FR-07, FR-09, FR-11, AC-07, AC-11

**Source:** Statement of Work, Section 3.1, Real-Time Messaging and Notifications; IA-06, Real-Time Delivery and Socket.IO Authorization Requirements.


#### UQ-03 - Group Membership Permissions

**Status:** Resolved

**Question:** Which users will have permission to add or remove members from a group conversation, and what restrictions will apply to those operations?

**Established Decisions:**

The Messenger system will allow authenticated users to create group conversations containing at least three distinct registered users. The authenticated user creating the group must be included in its initial membership.

Only the group creator will be authorized to add or remove group members. Other group members will be able to participate in authorized messaging operations but will not be permitted to modify group membership.

The group creator cannot be removed from the group in the initial implementation. Group membership changes must preserve a minimum of three distinct registered members.

The backend will reject attempts to add an existing member, remove a user who is not a member, add a nonexistent user, or perform a membership operation using an invalid user identifier. Unauthorized membership changes will also be rejected.

The backend will determine the acting user's identity from a verified JWT and will enforce membership management permissions using the conversation's persisted `createdBy` and `members` information.

Group membership changes will be stored persistently in MongoDB. Removed members will immediately lose authorization to access the group's protected operations, message history, and real-time events. Newly added or readded members will receive access to the group's entire stored message history, consistent with UQ-04.

The system will not support transferring group ownership or removing the group creator in the initial implementation.


#### UQ-04 - Group Membership and Message History Behavior

**Status:** Resolved

**Question:** How will the Messenger system determine access to historical group messages when users are added to or removed from a group conversation?

**Established Decisions:**

The Messenger system will persist group messages in MongoDB and associate each message with its corresponding conversation and authenticated sender.

The system will enforce group membership authorization when users retrieve messages or subscribe to protected conversation events.

When a user is removed from a group, the system will prevent that user from performing subsequent protected group operations or receiving subsequent protected group events.

The system will preserve stored group messages according to the established message persistence requirements.

The Messenger system will use current group membership to determine access to stored group message history. Authenticated users who are current members of a group conversation will be permitted to retrieve the entire stored message history, including messages sent before they joined the group.

When a user is removed from a group conversation, they will immediately lose access to the group's stored message history and protected messaging operations. Messages will remain stored in MongoDB and accessible to the remaining authorized members.

If a previously removed user is added back to the group, they will regain access to the entire stored message history. The system will not require membership start and end timestamps to enforce these history access rules.

The backend will enforce these restrictions using the authenticated user's verified JWT identity and the group's current membership information stored in MongoDB.


**Related Requirements:** FR-03, FR-04, FR-05, FR-09, AC-03, AC-04, AC-05, AC-09

**Source:** Statement of Work, Section 3.1, Group Messaging, Group Creation and Membership Management, Message History and Persistence, and Authorization and Conversation Privacy; IA-06, Group Membership and Conversation Authorization Requirements.


#### UQ-05 - Voluntary Group Leaving

**Status:** Unresolved

**Question:** Will the Messenger system allow users to voluntarily leave group conversations, and what restrictions or membership changes will apply when they do?

**Established Decisions:**

The Messenger system will support group creation and membership management, with group membership information stored persistently in MongoDB.

The system will enforce current group membership restrictions when determining whether users can access protected group operations, retrieve messages, or receive Socket.IO events.

When a user is no longer an authorized group member, the system will prevent that user from performing subsequent protected group operations or receiving subsequent protected group events.

**Remaining Open Questions:**

1. Will ordinary group members be allowed to voluntarily leave a group conversation?

2. Will the group creator be allowed to leave the group, and if so, what happens to their membership management permissions?

3. If the last remaining member leaves a group, will the group conversation be retained or deleted?

4. Will leaving a group require confirmation from the user?

5. If a user leaves a group and later rejoins, what historical messages will they be permitted to access?

**Related Requirements:** FR-04, FR-05, FR-09, AC-04, AC-05, AC-09

**Related Open Questions:** UQ-03, UQ-04

**Source:** Statement of Work, Section 3.1, Group Creation and Membership Management and Authorization and Conversation Privacy.


#### UQ-06 - Message Editing and Deletion Behavior

**Status:** Backend behavior resolved and implemented; browser controls deferred.

**Question:** How will Messenger handle message editing and deletion, including authorization, persistence, and presentation?

**Resolution:**

Authenticated users who are current conversation members may edit or delete their own active messages through the existing backend APIs. The backend verifies the authenticated user's identity, current conversation membership, and original message ownership before permitting modifications.

No editing or deletion time limit is imposed in the implemented backend.

Editing updates the stored message content. The system does not maintain a separate history of previous message content. Successful edits retain an `editedAt` timestamp in the stored message. Displaying an edited-message indicator in the browser is not part of the verified IA-06 MVP functionality.

Deletion uses soft deletion: the message record is retained with a deletion placeholder and associated deletion timestamp rather than being permanently removed from the database.

Message edits and deletions remain reflected in subsequent authorized history retrievals. Immediate Socket.IO broadcasts of edit and deletion changes are not implemented.

Browser controls for editing and deleting messages are deferred from the IA-06 MVP. The existing backend operations and their authorization requirements remain part of the implemented system.

**Deferred functionality:** Browser edit/delete controls, immediate real-time synchronization of message modifications, and separate message-edit history.

**Related Requirements:** FR-06, FR-09, FR-11, AC-06, AC-09, AC-11

**Source:** Statement of Work, Section 3.1, Message History, Editing, and Deletion; IA-06, Message Persistence and Real-Time Delivery Requirements.


#### UQ-07 - Basic Profile Information

**Status:** Account identification resolved and implemented; profile editing deferred.

**Question:** What account information will Messenger collect, display, and allow users to modify?

**Resolution:**

Messenger manages registered user accounts internally using a username and password. Registration does not require an email address or display name.

Each registered account has a unique user ID and username. Usernames must contain 3–30 characters consisting of letters, numbers, or underscores. Username uniqueness is case-insensitive.

Passwords must contain at least six characters and must not exceed 72 bytes when encoded as UTF-8. Passwords are stored as bcrypt hashes rather than plaintext.

Authenticated users can retrieve their own account identification information. The application also displays participant usernames to identify users in conversations without exposing password hashes.

**Deferred functionality:** Profile editing, profile pictures, biographies, and additional customizable profile fields are not included in the IA-06 MVP.

**Future design questions:** If profile editing is implemented later, the permitted fields, visibility rules, and treatment of username changes in existing conversations will require further decisions.

**Implementation Decision:** October 21, 2026. Registration requires a unique username and password without requiring an email address or display name.

**Related Requirements:** FR-01, FR-08, FR-09, FR-10, AC-01, AC-08, AC-10

**Source:** Statement of Work, Section 3.1, User Registration and Authentication and User Profiles; IA-06, Account Registration and Authentication Requirements.


#### UQ-08 - History Persistence and Retention

**Status:** Partially Resolved

**Question:** How will the Messenger system persist message history, and what retention rules will apply to stored messages?

**Established Decisions:**

The Messenger system will persist messages in MongoDB and associate each message with its conversation, authenticated sender, and message content.

Messages will be stored in a consistent order and remain available to authorized conversation participants after logout, backend restarts, and periods when users are offline.

The backend will enforce conversation membership authorization when retrieving stored message history.

The system will persist new messages before broadcasting successful delivery events through Socket.IO.

**Remaining Open Questions:**

1. Will messages be retained indefinitely during the application's operation, or will a defined retention period apply?

2. Will the system automatically remove messages after a specified amount of time?

3. What should happen to stored message history if a conversation is deleted or no longer has any members?

4. Will users have any ability to request the deletion of their stored message history beyond deleting individual messages they originally sent?

**Related Requirements:** FR-05, FR-06, FR-09, FR-11, NFR-03, AC-05, AC-06, AC-09, AC-11

**Source:** Statement of Work, Section 3.1, Message History, Editing, and Deletion and Security and Data Persistence; IA-06, Message Persistence and Offline Recovery Requirements.


#### UQ-09 - Message Delivery Behavior

**Status:** Resolved

**Question:** How will the Messenger system handle real-time message delivery, offline message recovery, delivery status information, and message timestamps?

**Established Decisions:**

The Messenger system will use Socket.IO to deliver new messages to connected, authorized conversation participants without requiring them to refresh the application.

The backend will authenticate Socket.IO connections and enforce conversation membership authorization before allowing users to subscribe to or receive protected conversation events.

New messages will be persisted in MongoDB before the backend broadcasts successful message delivery events.

Users who are offline when messages are sent will be able to retrieve those messages from persistent conversation history when they return.

The application will provide appropriate feedback when message submission fails and will not incorrectly indicate that an unsuccessful operation was completed.

The backend will assign a creation timestamp (`createdAt`) to each message when it is persisted in MongoDB. Message history will be retrieved in descending order by creation timestamp, with the MongoDB message identifier (`_id`) used as a secondary descending sort key to ensure deterministic ordering when timestamps are equal. The system will use cursor-based pagination to retrieve older messages. Client-provided timestamps will not determine the ordering of stored messages.

Messenger will display the backend-assigned creation timestamp for each message in the user interface. Message timestamps will be stored in UTC and converted to the user's local time zone by the frontend for display. Messages created on the user's current local calendar date will display the time in a 12-hour format with AM or PM (for example, 2:35 PM). Older messages will display an abbreviated month, day, year, and time (for example, Oct 27, 2026, 2:35 PM). These display formats will not affect message ordering, which will continue to use the backend-assigned creation timestamp and message identifier.

Messenger will use three client side message states: Sending, Sent, and Failed. A message will be considered Sending while the client is waiting for confirmation from the backend. A message will be considered Sent only after the backend confirms that it has been successfully persisted in MongoDB. A message will be considered Failed if the message submission fails or the backend rejects the request.

The system will not implement separate Delivered or Read statuses in the initial Messenger implementation. Successfully storing a message does not guarantee that another user's connected client has received or viewed it. Real time delivery will occur only after successful persistence, and users who were offline will be able to retrieve stored messages through conversation history when they reconnect.

Messenger will provide a visible connection status indicator when the client loses its real-time connection to the backend. During an interruption, the interface will display a message indicating that the connection has been lost and that reconnection is being attempted. Once the connection is restored, the warning will be removed, and the client will retrieve conversation history to recover messages that may have been missed while disconnected.

If the backend rejects a message submission or the submission fails, the interface will indicate that the message was not successfully confirmed. If a connection interruption prevents the client from determining whether a message was persisted, Messenger will not automatically resend the message. Instead, the user will be able to check the conversation history before attempting to send it again, reducing the risk of duplicate messages.

Connection interruptions will not change the established definition of the Sent state, which requires confirmation of successful backend persistence. The interface will not claim that another user's client received a message solely because the backend stored it.

**Approved MVP deferral, October 31, 2026:** Persistent unread indicators, unread counts, and per-user/per-conversation read positions are deferred; transient FR-07 notifications remain in scope. They remain future product intent, not implemented release behavior. This does not defer live message display, persistent missed-message recovery, or accurate submission states. The UI indicates an unconfirmed submission when a response is lost, rather than claiming a definitive rejection or delivery. Users can refresh history before retrying.

**Related Requirements:** FR-05, FR-07, FR-09, FR-11, NFR-03, NFR-04, AC-05, AC-07, AC-09, AC-11, AC-13

**Source:** Statement of Work, Section 3.1, Real Time Messaging and Notifications, Message History and Persistence, and Security and Data Persistence; IA-06, Real-Time Delivery, Offline Recovery, and User Interface Requirements.


#### UQ-10 - Security Protections

**Status:** Core MVP security protections resolved and implemented; additional safeguards remain future considerations.

**Question:** What security protections will Messenger implement to protect user accounts, messages, and conversation access?

**Resolution:**

Messenger uses bcrypt to hash registered-user passwords. Passwords are never stored in plaintext.

The backend issues JWTs with an eight-hour expiration period and verifies their signatures and required claims before granting protected access. The authenticated user's identity is derived from the verified token rather than client-supplied identifiers.

The browser retains its JWT in memory during the authenticated session. Logout discards the browser's token and disconnects its Socket.IO connection. Logout does not revoke a copied JWT on the server.

The backend enforces current conversation membership for protected HTTP and Socket.IO operations. Unauthorized users cannot retrieve conversation history, send messages, or subscribe to protected conversation events.

Socket.IO connections require authentication, and token expiration is enforced for active connections. Removed group members lose subsequent protected access and event subscriptions.

Registration validates usernames and passwords. Passwords must contain at least six characters and must not exceed 72 bytes when encoded as UTF-8. No specific combination of uppercase letters, lowercase letters, numbers, or special characters is required.

Application secrets and credentials are excluded from version control. The repository provides example environment configuration without usable authentication secrets.

**Future considerations:** Login-attempt rate limiting, account lockouts, and additional deployment-specific safeguards are outside the verified MVP scope.

**Related Requirements:** FR-01, FR-09, FR-10, NFR-01, NFR-04, NFR-05, AC-01, AC-09, AC-10, AC-13, AC-14

**Source:** Statement of Work, Section 3.1, User Registration and Authentication, Authorization and Conversation Privacy, and Security and Data Persistence; IA-06, Authentication, Authorization, Socket.IO Security, and Reproducible Setup Requirements.


#### UQ-11 - Direct Conversation Creation and Duplicate Prevention

**Status:** Resolved and verified.

**Question:** How will Messenger create direct conversations between registered users while preventing unintended duplicate conversations?

**Resolution:**

A direct conversation contains exactly two distinct registered users, including the authenticated creator.

The backend validates the requested participants, confirms that their accounts exist, and enforces the authenticated creator's membership.

To prevent duplicate direct conversations, the backend generates a canonical `directKey` from the two participants' identifiers in a consistent order. MongoDB enforces uniqueness through a unique partial index.

If a direct conversation already exists between the same participants, the backend rejects the duplicate creation request with HTTP 409 Conflict, regardless of participant ordering or whether requests occur concurrently.

Authorized participants can access the existing conversation through the conversation-listing functionality defined in FR-12. Rejected duplicate requests do not create new conversations or trigger new-conversation notifications.

**Verification:** Automated integration tests verify sequential and concurrent duplicate prevention, uniqueness enforcement, and HTTP 409 responses. The database's unique partial index on the canonical `directKey` prevents concurrent requests from creating duplicate records.

**Related Requirements:** FR-02, FR-09, FR-10, FR-12, AC-02, AC-09, AC-10, AC-12

**Source:** Statement of Work, Section 3.1, Private Messaging; IA-06, Direct Conversation and Authorization Requirements.


## 6. Requirements Traceability

The following tables map the Messenger system's functional and nonfunctional requirements to their corresponding acceptance criteria and source documents. These mappings support implementation planning, verification, and traceability between the Statement of Work, requirements, and IA-06 implementation.

### Functional Requirements Traceability

| Requirement ID | Requirement | Acceptance Criteria | Source |
|---|---|---|---|
| FR-01 | User Registration and Identification | AC-01 | Statement of Work, Section 3.1; IA-06 |
| FR-02 | Private Messaging | AC-02 | Statement of Work, Section 3.1; IA-06 |
| FR-03 | Group Messaging | AC-03 | Statement of Work, Section 3.1; IA-06 |
| FR-04 | Group Management | AC-04 | Statement of Work, Section 3.1; IA-06 |
| FR-05 | Message History | AC-05 | Statement of Work, Section 3.1; IA-06 |
| FR-06 | Message Editing and Deletion | AC-06 | Statement of Work, Section 3.1 |
| FR-07 | Message Notifications | AC-07 | Statement of Work, Section 3.1 |
| FR-08 | User Profiles | AC-08 | Statement of Work, Section 3.1 |
| FR-09 | Conversation Access Control | AC-09 | Statement of Work, Section 3.1; Ethics Reflection; IA-06 |
| FR-10 | User Authentication and Session Management | AC-10 | Statement of Work, Section 3.1; IA-06 |
| FR-11 | Real-Time Message Delivery | AC-11 | Statement of Work, Section 3.1; IA-06 |
| FR-12 | Conversation Discovery and Listing | AC-12 | Statement of Work, Section 3.1; IA-06 |

### Nonfunctional Requirements Traceability

| Requirement ID | Requirement | Acceptance Criteria | Source |
|---|---|---|---|
| NFR-01 | Authentication and Security Constraint | AC-09, AC-10 | Statement of Work, Section 3.1; IA-06 |
| NFR-02 | Prototype Scope Constraint | AC-14 | Statement of Work, Sections 3.1 and 3.2; IA-06 |
| NFR-03 | Message Persistence | AC-05, AC-11 | Statement of Work, Section 3.1; IA-06 |
| NFR-04 | Application Reliability and Error Handling | AC-13 | Statement of Work, Section 3.1; IA-06 |
| NFR-05 | Reproducible Local Execution | AC-14 | Statement of Work, Sections 3.1 and 7.2; IA-06 |
