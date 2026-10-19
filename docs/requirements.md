# Messenger Requirements Engineering

**Project:** Messenger Application  
**Student:** Sean Hamilton  
**Course:** CPS 490 - Capstone I  

**Document Status:** Draft 
**Last Revised:** October 19, 2026  

**Submission Date:** October 12, 2026

---

### Revision History

| Date | Revision | Description |
|---|---|---|
| October 12, 2026 | Initial Requirements | Established the original functional requirements, nonfunctional requirements, acceptance criteria, assumptions, open questions, and traceability for the Messenger application. |
| October 19, 2026 | IA-06 Requirements Revision | Updated the requirements to reflect the required implementation technology stack, internal account registration and authentication, conversation authorization, persistent messaging, real-time delivery, application reliability, and reproducible local execution. Expanded the functional requirements, nonfunctional requirements, acceptance criteria, and traceability mappings while preserving existing requirement identifiers. Reviewed assumptions and open questions to distinguish established implementation requirements from unresolved design decisions. |

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

The Messenger system shall allow authenticated users to edit or delete messages they have previously sent within private and group conversations.

When a user edits a message, the system shall update the stored message content and display the updated content in the correct conversation.

When a user deletes a message, the system shall update the stored conversation data according to the established message deletion behavior so that the deleted message is no longer displayed as an active message in the conversation.

The system shall verify the authenticated user's identity and confirm that the user is the original sender before allowing a message to be edited or deleted. Attempts to edit or delete messages belonging to another user shall be rejected.

Message edits and deletions shall be stored persistently so that the resulting changes remain reflected in the conversation after users log out or the backend restarts.

**Source:** Statement of Work, Section 3.1, Message Editing and Deletion and Authorization and Conversation Privacy.


### FR-07 - Message Notifications

The Messenger system shall provide notifications within the browser interface when an authenticated user receives a new private or group message.

When a new private message is received, the system shall notify the intended recipient. When a new group message is received, the system shall notify the applicable authorized group members.

Notifications shall be associated with the correct conversation and shall not disclose message information to users who are not authorized participants.

The system shall use its real time communication capabilities to support notifications for connected users. The specific notification presentation and behavior will be established before implementation.

**Source:** Statement of Work, Section 3.1, Real Time Messaging and Notifications and Authorization and Conversation Privacy.


### FR-08 - User Profiles

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

The system shall associate each real time message event with the correct conversation and shall deliver the event only to users authorized to participate in that conversation.

The system shall verify user authentication when establishing protected Socket.IO connections and shall enforce conversation membership restrictions before allowing users to subscribe to conversation events.

When a user is disconnected or not actively using Messenger, the system shall preserve messages in persistent storage so that the user can retrieve missed messages through the conversation history after reconnecting.

**Source:** Statement of Work, Section 3.1, Real Time Messaging and Notifications, Message History and Persistence, and Authorization and Conversation Privacy; IA-06, Real-Time Delivery and Socket.IO Authorization Requirements.

### FR-12 - Conversation Discovery and Listing

The Messenger system shall allow authenticated users to retrieve and view a list of the private and group conversations in which they are authorized participants.

The system shall identify the conversations associated with the authenticated user and provide the information necessary for the user to distinguish between and access their available conversations.

The system shall retrieve conversation membership information from persistent storage and shall exclude conversations in which the authenticated user is not an authorized participant.

When a user creates a new conversation or an authorized membership change occurs, the system shall reflect the updated conversation membership when the user's conversation list is retrieved.

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

3. The system stores each group message with the correct conversation identifier, authenticated sender, and message content.

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

**Verification Method:** Demonstration and automated testing using multiple registered accounts to verify authorized conversation listing, private and group conversation visibility, conversation creation, membership changes, persistent conversation information, and rejection of unauthorized requests.

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

**Status:** Partially Resolved

**Question:** How will the Messenger system present notifications for new private and group messages, and how should those notifications behave depending on the user's current activity?

**Established Decisions:**

The Messenger system will provide in app notifications for new messages received in private and group conversations.

Notifications will be delivered to connected, authorized users through Socket.IO. The system will enforce conversation membership restrictions to prevent unauthorized users from receiving protected notification information.

External notification services, email notifications, and operating system push notifications are not required for the Messenger implementation.

**Remaining Open Questions:**

1. Will Messenger use unread message indicators, notification badges, temporary alerts, or a combination of these methods?

2. Should a notification appear when the user is already viewing the conversation in which the new message was received?

3. When should a notification or unread indicator be cleared?

4. What conversation information should be displayed in a notification?

**Related Requirements:** FR-07, FR-09, FR-11, AC-07, AC-11

**Source:** Statement of Work, Section 3.1, Real Time Messaging and Notifications; IA-06, Real-Time Delivery and Socket.IO Authorization Requirements.


#### UQ-03 - Group Membership Permissions

**Status:** Unresolved

**Question:** Which users will have permission to add or remove members from a group conversation, and what restrictions will apply to those operations?

**Established Decisions:**

The Messenger system will allow authenticated users to create group conversations and support the addition and removal of registered group members.

The system will enforce group membership permissions on the backend and reject membership changes attempted by users without the required authorization.

Group membership information will be stored persistently in MongoDB. When membership changes occur, the system will update access permissions so that removed members cannot continue accessing protected group operations or receiving protected group events.

**Remaining Open Questions:**

1. Will only the group creator be permitted to add or remove members, or will all group members have these permissions?

2. Can the group creator be removed from the group, and if so, under what conditions?

3. Are any additional restrictions needed to prevent invalid membership changes, such as adding a user who is already a member?


#### UQ-04 - Group Membership and Message History Behavior

**Status:** Unresolved

**Question:** How will the Messenger system determine access to historical group messages when users are added to or removed from a group conversation?

**Established Decisions:**

The Messenger system will persist group messages in MongoDB and associate each message with its corresponding conversation and authenticated sender.

The system will enforce group membership authorization when users retrieve messages or subscribe to protected conversation events.

When a user is removed from a group, the system will prevent that user from performing subsequent protected group operations or receiving subsequent protected group events.

The system will preserve stored group messages according to the established message persistence requirements.

**Remaining Open Questions:**

1. When a user is added to an existing group, will they be permitted to view messages sent before they joined, or only messages sent after their membership began?

2. When a user is removed from a group, will they lose access to the entire conversation history, including messages they previously received?

3. If a user is removed and later added back to the same group, which historical messages will become available to them?

4. Will the system need to record membership start and end times to enforce the selected history access rules?

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

**Status:** Unresolved

**Question:** How will the Messenger system handle message editing and deletion, including time restrictions, message history presentation, and updates to other conversation participants?

**Established Decisions:**

The Messenger system will allow authenticated users to edit and delete messages they originally sent.

The backend will verify the authenticated user's identity and enforce message ownership before allowing an edit or deletion.

Successful message changes will be persisted in MongoDB. Unauthorized or unsuccessful modification attempts will not change the stored message.

The system will preserve conversation access restrictions when processing message modifications.

**Remaining Open Questions:**

1. Will users be allowed to edit or delete their messages at any time, or will a time limit apply?

2. Will edited messages display an indicator showing that their content has been modified?

3. When a message is deleted, will it be removed entirely from the conversation or replaced with a placeholder indicating that a message was deleted?

4. Will message edits and deletions be reflected immediately for other connected conversation participants through Socket.IO?

5. Will the system retain any record of previous message content after an edit or deletion?

**Related Requirements:** FR-06, FR-09, FR-11, AC-06, AC-09, AC-11

**Source:** Statement of Work, Section 3.1, Message History, Editing, and Deletion; IA-06, Message Persistence and Real-Time Delivery Requirements.


#### UQ-07 - Basic Profile Information

**Status:** Unresolved

**Question:** What user information will the Messenger system collect during registration, display in user profiles, and allow users to modify?

**Established Decisions:**

The Messenger system will support internal user registration and authentication.

Each registered user will have a unique account identity and associated profile information stored persistently in MongoDB.

The system will securely hash account passwords using bcrypt and use JWT based authentication to identify users accessing protected functionality.

Authenticated users will be able to view and update permitted profile information. The backend will validate profile changes and enforce authorization to prevent users from modifying another user's account information without permission.

**Remaining Open Questions:**

1. Which fields will be required during registration, such as username, email address, password, or display name?

2. Which profile fields will be visible to other registered users?

3. Which profile fields will users be allowed to modify after registration?

4. Will Messenger support optional profile information, such as a profile picture or short biography?

5. What validation rules and uniqueness constraints will apply to usernames, email addresses, and other profile fields?

6. If a user changes their display name or other identifying profile information, how should that change appear in existing conversations and message history?

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

**Status:** Partially Resolved

**Question:** How will the Messenger system handle real-time message delivery, offline message recovery, delivery status information, and message timestamps?

**Established Decisions:**

The Messenger system will use Socket.IO to deliver new messages to connected, authorized conversation participants without requiring them to refresh the application.

The backend will authenticate Socket.IO connections and enforce conversation membership authorization before allowing users to subscribe to or receive protected conversation events.

New messages will be persisted in MongoDB before the backend broadcasts successful message delivery events.

Users who are offline when messages are sent will be able to retrieve those messages from persistent conversation history when they return.

The application will provide appropriate feedback when message submission fails and will not incorrectly indicate that an unsuccessful operation was completed.

**Remaining Open Questions:**

1. Will messages display a delivery status, such as sent, delivered, or read?

2. Will messages display timestamps, and if so, what timestamp format will be used?

3. Will Messenger distinguish between a message successfully stored by the backend and a message received by another user's connected client?

4. How will the interface communicate temporary connection interruptions or delays in real-time delivery?

5. Will users receive any indication that messages were received while they were offline?

**Related Requirements:** FR-05, FR-07, FR-09, FR-11, NFR-03, NFR-04, AC-05, AC-07, AC-09, AC-11, AC-13

**Source:** Statement of Work, Section 3.1, Real Time Messaging and Notifications, Message History and Persistence, and Security and Data Persistence; IA-06, Real-Time Delivery, Offline Recovery, and User Interface Requirements.


#### UQ-10 - Security Protections

**Status:** Partially Resolved

**Question:** What security protections will the Messenger system implement to protect user accounts, messages, and conversation access?

**Established Decisions:**

The Messenger system will use bcrypt to securely hash user passwords before storing account credentials in MongoDB. Plaintext passwords will not be stored.

The system will use JSON Web Tokens (JWTs) to authenticate registered users. The backend will verify authentication for protected operations and determine the acting user's identity from the verified token rather than trusting user identifiers supplied by the browser.

The backend will enforce conversation membership authorization for both HTTP requests and Socket.IO operations. Users who are not authorized members of a conversation will not be permitted to retrieve its messages, send messages to it, or subscribe to its protected events.

Socket.IO connections will be authenticated, and the backend will verify authorization before allowing users to join protected conversation rooms. Membership changes will be reflected in access controls so that removed members cannot continue receiving protected events.

The system will validate submitted information and reject unauthorized operations without modifying protected data.

Application secrets and credentials will be excluded from version control. The project will provide an example environment configuration file without including actual secrets.

**Remaining Open Questions:**

1. What JWT expiration period will the application use, and how will expired sessions be handled?

2. How will the browser store and manage authentication tokens during an active session?

3. Will additional protections, such as login attempt limits or account lockouts, be implemented?

4. What password complexity requirements will apply during account registration?

5. What additional safeguards, if any, will be needed for the local development and evaluation environment?

**Related Requirements:** FR-01, FR-09, FR-10, NFR-01, NFR-04, NFR-05, AC-01, AC-09, AC-10, AC-13, AC-14

**Source:** Statement of Work, Section 3.1, User Registration and Authentication, Authorization and Conversation Privacy, and Security and Data Persistence; IA-06, Authentication, Authorization, Socket.IO Security, and Reproducible Setup Requirements.


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

