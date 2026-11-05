# Messenger Diagrams and Analysis

**Project:** Messenger Application
**Student:** Sean Hamilton
**Course:** CPS 490 - Capstone I
**Document Status:** Revised for IA-06 MVP
**Original Submission Date:** October 12, 2026
**Last Revised:** November 5, 2026

---

## Revision History

| Date | Description |
|---|---|
| October 12, 2026 | Initial diagrams and analysis submitted for IA-04. |
| October 19, 2026 | Revised diagrams and analysis to align with updated Messenger requirements and IA-06 implementation expectations. |
| October 31, 2026 | Reconciled the analysis with approved MVP scope, backend capabilities, deferred browser functionality, and resolved design decisions. |
| November 4-5, 2026 | Documented conversation discovery notifications, Socket.IO browser message submission, and implementation-specific authentication and authorization clarifications. |

---

## IA-06 Implementation Reconciliation Notes

The analysis below incorporates implementation decisions documented during the October 31 and November 4, 2026 reconciliations. Earlier design questions are retained as historical context where relevant, while the numbered sections describe the approved IA-06 MVP.

### October 31, 2026 — MVP scope and security reconciliation

The approved MVP retains registration, login, current-account retrieval, conversation management, persistent messaging, authorized history retrieval, and real-time delivery. Profile modification, persistent unread tracking, and browser controls for message editing, deletion, and group membership management are deferred; the corresponding implemented backend APIs remain.

The reconciliation resolved UQ-03, UQ-04, UQ-09, and UQ-10. JWT verification establishes the acting identity without a separate User collection lookup for every protected message operation; `/api/auth/me` performs a current account lookup. Socket.IO conversation-room membership is authorized at join and revoked on removal. Transient activity notices additionally query current membership. Verified sequential removal behavior must not be interpreted as proof of distributed or concurrent race protection.

### November 4, 2026 — Conversation discovery clarification

After successful conversation creation, the backend emits `conversation:created` to the participants' authenticated Socket.IO user rooms. Connected browsers then refresh their authorized conversation lists through the existing HTTP API, allowing discovery without an initial message. Browser message submission uses Socket.IO, while the HTTP message API remains available.

The PlantUML diagrams are retained as conceptual representations and are not claimed to depict every event or implementation detail.

## 1. Data Flow Diagram

### 1.1 Engineering Question

The Data Flow Diagram (DFD) is intended to answer the following engineering question: Where does information come from, where does it go, what transforms it, and what information must persist within the Messenger system?

The DFD shows how information moves between Messenger users, the system's main processes, and its data stores. Users interact with Messenger by registering or logging into their accounts, viewing their account identity, creating private and group conversations, sending messages, and requesting conversation history. The backend also supports authorized message editing, soft deletion, and group membership management, while the corresponding browser controls and profile editing are deferred from the approved IA-06 MVP. The system processes these requests, verifies user identity and conversation access when required, and either stores the resulting information or returns the appropriate information to authorized users.

The diagram also identifies the information Messenger needs to maintain, including user accounts, conversation messages, and conversation membership information. These flows help explain how authentication, message processing, conversation management, and persistent storage depend on one another to support the required functionality. They also establish the importance of verifying conversation access before users can retrieve messages or participate in protected messaging operations.


### 1.2 Requirements Represented

The DFD represents the functional requirements established in the Requirements Engineering document, along with the nonfunctional requirements related to authentication, security, and message persistence. Each process handles a specific part of Messenger's functionality, while the data stores maintain the information needed to support those operations.

| Requirement | DFD Component | Representation |
|---|---|---|
| FR-01 | P1, D1 | Processes user registration and maintains registered account information. |
| FR-02 | P2, P3, D1, D2, D3 | Identifies registered participants, manages private conversations, and processes and stores private messages. |
| FR-03 | P2, P3, D2, D3 | Processes group messages and stores them within the appropriate conversations. |
| FR-04 | P2, D3 | Processes group creation and membership changes while maintaining conversation information. |
| FR-05 | P4, D2, D3 | Retrieves stored conversation messages after verifying that the requesting user has access. |
| FR-06 | P3, D2 | Processes authorized message edits and deletions and updates stored message information. |
| FR-07 | P5, D3 | Provides transient message activity notices to authorized, connected participants; persistent unread tracking is deferred. |
| FR-08 | P1, D1 | Retrieves current account identification information; profile modification is deferred from the IA-06 MVP. |
| FR-09 | P1, P2, P3, P4, P5, D3 | Uses verified identity and conversation membership information to enforce access restrictions on protected operations. |
| FR-10 | P1, D1 | Authenticates registered users and establishes verified identity for protected operations. |
| FR-11 | P3, P5, D2, D3 | Delivers successfully stored messages to connected, authorized conversation participants. |
| FR-12 | P2, D3 | Retrieves authorized conversation lists. After successful conversation creation, connected participants receive a `conversation:created` notification and refresh their lists; this event is not explicitly shown as a separate DFD flow. |
| NFR-01 | P1, P2, P3, P4, P5, D1, D3 | Supports password protection, authenticated operations, and conversation authorization. |
| NFR-03 | P3, P4, D2 | Maintains persistent conversation messages so they remain available after disconnects and backend restarts. |
| NFR-04 | P1, P2, P3, P4, P5 | Supports validation, rejection of unauthorized operations, and appropriate failure handling. |

These mappings show how Messenger's requirements depend on multiple processes and data stores. They also identify where authentication, authorization, and persistent storage must be considered together. For example, message history depends on both stored messages and verified conversation membership, while real-time delivery depends on successful message storage and authorization of the intended recipients.


### 1.3 Responsibilities and Dependencies

The DFD divides Messenger into five main processes. Manage Accounts (P1) handles registration, login, authentication, and current-account identification; profile editing is deferred from the IA-06 MVP. Manage Conversations (P2) handles username-based private and group conversation creation, authorized conversation listing, and the retained group membership APIs. After a new conversation is persisted, the backend emits `conversation:created` to its participants' authenticated Socket.IO user rooms, prompting connected clients to refresh their authorized conversation lists. This event is described here but is not separately drawn in the DFD. Process Messages (P3) validates and persists private and group messages submitted by the browser through Socket.IO; the existing HTTP message API remains available. P3 also supports backend message editing and soft deletion, while browser controls for those operations are deferred. Retrieve Message History (P4) retrieves stored messages for authorized conversation members. Deliver Live Messages and Activity (P5) delivers successfully persisted new messages and transient activity notices to connected, authorized users; persistent unread tracking is deferred. Separating these responsibilities identifies which processes handle specific operations and where information must be stored or retrieved.

The diagram also reveals that several processes depend on authentication and conversation membership information. The backend verifies JWT signatures and required claims to establish the acting user's identity for protected operations; this does not require querying the User collection for every message request. The `/api/auth/me` endpoint separately retrieves the current account record. P1 represents these account and authentication responsibilities, while the Conversations and Membership data store (D3) provides membership information for authorization. P2 enforces permissions for conversation creation and membership changes, P3 verifies membership before accepting message writes, and P4 verifies access before returning stored history. Socket.IO connections require authentication, and joining a protected conversation room requires a membership check. When a group member is removed, the backend revokes that user's existing subscriptions to the affected conversation room. These dependencies demonstrate why identity verification, current membership checks, and room authorization must work together to protect Messenger.

Another important dependency involves message persistence and real-time delivery. When a user sends a message, P3 must successfully store it in the Messages data store (D2) before passing the stored message information to P5 for delivery through Socket.IO. If storage fails, the system must report the failure rather than indicating that the message was successfully sent. Successful storage confirms that the backend accepted and persisted the message; it does not establish that another user's client received or read it. The MVP does not implement Delivered or Read confirmations. Users who are offline when messages are sent can retrieve those messages from persistent conversation history through P4 when they return. This shows how message processing, persistent storage, real-time delivery, and history retrieval work together to support reliable communication.

The DFD also shows how changes to conversation membership affect other parts of Messenger. When a user is added to or removed from a conversation, P2 updates the membership information maintained in D3. The updated information must then be reflected in authorization checks for message processing, history retrieval, and real-time delivery. A removed member must not continue receiving protected conversation events. This demonstrates that conversation management and access control are connected responsibilities rather than independent operations.


### 1.4 Ambiguities and Unresolved Questions

Constructing and reviewing the DFD originally identified questions about how Messenger information would be accessed, maintained, and delivered. The diagram establishes the main information flows but does not independently define every security, membership, or delivery policy. During IA-06 implementation, several of these questions were resolved through explicit design decisions and verified functionality. The discussion below preserves the original engineering concerns while distinguishing resolved MVP behavior from deferred features and remaining limitations.

The user identity question (`UQ-01`) was resolved through registered accounts, login, and JWT-based authentication. Protected operations derive the acting user's identity from verified JWT information rather than trusting a client-supplied user identifier. The group membership and history questions (`UQ-03` and `UQ-04`) were also resolved. Only the group creator can add or remove members, and a group must retain at least three members. Current members, including newly added or readded members, can retrieve the complete stored conversation history, including messages sent before they joined or rejoined. Removed members lose access to protected conversation operations and their existing Socket.IO conversation-room subscriptions are revoked. These rules establish the MVP's membership and history-access policy without claiming that distributed or concurrent membership races have been fully verified.

The notification and delivery questions (`UQ-02` and `UQ-09`) were resolved for the approved MVP. Socket.IO delivers successfully persisted new messages to connected, authorized conversation participants and supports transient activity notices. The browser presents messages in deterministic order, displays timestamps in local time, and distinguishes sending from confirmed storage or an unconfirmed failure. The MVP does not implement Delivered or Read confirmations, persistent unread tracking, or automatic retries of failed message writes. For message persistence (`UQ-08`), MongoDB retains stored messages for authorized history retrieval after disconnects and backend restarts. Message deletion uses a soft-delete placeholder rather than removing the stored record. No implemented automatic retention schedule or conversation-deletion history policy is asserted here.

Conversation authorization (`FR-09` and `NFR-01`) was resolved through server-side JWT verification and conversation membership enforcement. Protected message operations and history retrieval require an authenticated user with the appropriate conversation access. Socket.IO conversation-room joins are authorized against current membership, and removing a group member revokes that user's existing room subscriptions. Current members can retrieve the complete stored history, while removed members cannot access protected conversation operations. These rules were verified for the documented sequential removal scenarios; the implementation does not claim comprehensive verification of distributed or concurrent membership races.

The revised DFD remains consistent with the scope established in the Statement of Work and `NFR-02`. It represents required registration, authentication, private and group messaging, conversation management, persistence, and real-time delivery without introducing unrelated features or external integrations. This helps ensure that the model reflects the Messenger system defined by the revised requirements rather than adding functionality that has not been approved.


## 2. Sequence Diagram

### 2.1 Engineering Question

The Sequence Diagram is intended to answer the following engineering question: Who communicates with whom, in what order, and what happens when the scenario does not follow only the ideal path?

The Sequence Diagram models an authenticated Messenger user sending a private message to another registered user. It shows the interactions between the sender, Messenger Interface, authentication and conversation authorization, message processing, conversation information, persistent storage, real-time delivery, and the recipient. In the implemented browser workflow, message submission uses Socket.IO, while the existing HTTP message API remains available. The backend establishes the sender's identity through JWT signature and claim verification, checks conversation membership, validates message content, and persists the message before broadcasting it to connected, authorized conversation participants. Protected message operations do not require a separate User collection lookup for every submission; `/api/auth/me` performs current-account retrieval separately. The diagram represents these responsibilities conceptually rather than documenting every Socket.IO handshake or acknowledgment detail.

The diagram also shows how the recipient can retrieve stored conversation history, including messages sent while they were offline. Alternative paths demonstrate what happens when authentication fails, a user is not authorized to access the conversation, a message or conversation is invalid, or message storage fails. The history retrieval process also includes authentication, authorization, and retrieval failure paths. By modeling these interactions in order, we can better understand how Messenger handles private messaging, why certain operations must succeed before others can continue, and how the system prevents unsuccessful or unauthorized operations from being treated as successful.


### 2.2 Requirements Represented

The Sequence Diagram primarily represents the requirements related to private messaging, user authentication, conversation authorization, message persistence, real-time delivery, and conversation history. Each interaction shows how Messenger processes a private message, verifies that the operation is authorized, stores the message, and makes it available to the intended recipient.

| Requirement | Sequence Diagram Representation |
|---|---|
| FR-02 | The sender submits a private message to another registered user, Messenger stores it in the appropriate private conversation, and the recipient can retrieve the message. |
| FR-05 | The recipient requests private conversation history, which is retrieved from persistent storage after the system verifies authentication and conversation access. |
| FR-07 | Real-time delivery provides new-message events and applicable transient activity notices to connected, authorized participants; persistent unread tracking is deferred. |
| FR-09 | The backend enforces conversation membership for protected message operations and history retrieval. Socket.IO conversation-room joins require membership authorization, and removed members lose their existing room subscriptions; the implementation does not perform a separate recipient membership query for every full-message broadcast. |
| FR-10 | The backend verifies JWT signatures and required claims to establish authenticated identity rather than trusting client-supplied user identifiers. Protected message operations do not require a User collection lookup for every request; `/api/auth/me` separately retrieves the current account record. |
| FR-11 | After successfully storing a message, Messenger uses Socket.IO to deliver it to connected, authorized conversation participants without requiring a refresh. |
| NFR-01 | Authentication and conversation authorization protect user accounts and private conversation information from unauthorized access. |
| NFR-03 | Private messages are stored persistently and remain available after users disconnect or the backend restarts. |
| NFR-04 | The system rejects invalid or unauthorized requests and handles message validation, storage, and history retrieval failures without incorrectly indicating success. |

These interactions demonstrate how Messenger's requirements work together during private messaging. They show that certain operations depend on earlier steps being completed successfully. The backend must authenticate the user and verify conversation access before processing protected requests. Messages must also be successfully stored before real-time delivery occurs. If the recipient is offline, the stored message remains available for retrieval through authenticated conversation history.


### 2.3 Responsibilities and Dependencies

The Sequence Diagram shows that private messaging involves several responsibilities that must occur in a specific order. When a sender submits a private message, the backend verifies the JWT signature and required claims to establish the sender's identity, then checks whether that user is authorized to access the conversation. The protected message operation does not require a separate User collection lookup; current-account retrieval is handled by `/api/auth/me`. The sender's identity is determined from verified JWT information rather than an identifier supplied by the interface. Message Processing then retrieves the conversation details, including the conversation type and participants, from the Conversations and Membership data store. It also validates the message content before attempting storage. If authentication fails, the sender is not authorized, or the message or conversation is invalid, the system rejects the operation rather than continuing with message storage.

Another important dependency involves message persistence and real-time delivery. After the sender and conversation have been validated, Message Processing stores the private message in MongoDB. The message must be successfully stored before the backend broadcasts it to connected, authorized conversation participants through Socket.IO. If storage fails, the sender receives a failure response, and the system does not broadcast the message as successfully sent. This demonstrates why message persistence must occur before real-time delivery and why the interface must distinguish between a successful submission and an unsuccessful operation.

The diagram also shows how conversation history retrieval depends on previously stored messages and verified conversation access. When the recipient opens the private conversation, the backend authenticates the request and confirms that the recipient is an authorized participant before retrieving the stored messages. The messages are then returned through the Messenger Interface and displayed to the recipient. This also supports offline message recovery because messages sent while a recipient was disconnected remain available in persistent conversation history when they return.

Another important observation involves the relationship between real-time delivery and notification processing. After a message is successfully stored, Messenger can provide real-time message events and applicable notifications to connected, authorized participants. However, successful storage does not necessarily confirm that another user's client received or displayed the message. Under the resolved MVP decision for `UQ-09`, the browser distinguishes Sending, Sent (confirmed storage), and unconfirmed failure states. Delivered and Read confirmations are not implemented, and failed message writes are not automatically retried. The diagram therefore establishes the required ordering of storage and broadcasting without assuming that message receipt or reading has been confirmed.


### 2.4 Ambiguities and Unresolved Questions

Constructing and reviewing the Sequence Diagram originally identified questions about authentication, authorization, notification behavior, message persistence, and history access. The diagram establishes the order of interactions for the selected private messaging scenario but does not independently define every implementation policy. During IA-06 implementation, several of these questions were resolved through documented design decisions and verification. The discussion below preserves the original engineering concerns while distinguishing implemented MVP behavior from deferred functionality and remaining verification limitations.

The authentication and session questions (`UQ-01` and `UQ-10`) were resolved for the approved MVP. Messenger supports registration and login for accounts with bcrypt-protected passwords. The backend verifies JWT signatures and required claims to establish the acting user's identity and enforces conversation membership for protected operations. JWTs expire after eight hours, and the browser retains its token in memory rather than persistent browser storage. Logout clears the browser's authentication state and disconnects its Socket.IO connection, but it does not revoke an already-issued JWT on the server. These decisions define the implemented session behavior without implying additional token-revocation protections.

The notification and delivery questions (`UQ-02` and `UQ-09`) were resolved for the approved MVP. Messenger uses Socket.IO to deliver successfully persisted new messages to connected, authorized conversation participants and to provide transient activity notices. The browser distinguishes Sending, Sent (confirmed storage), and unconfirmed failure states, but does not claim that another user's client received or read a message. Delivered and Read confirmations, persistent unread tracking, and automatic retries of failed message writes are not implemented. Messages sent while a recipient is offline remain available through authenticated conversation history when that user reconnects; this does not imply that an offline notification was delivered.

The Sequence Diagram also reveals important dependencies involving message persistence and failure handling. MongoDB stores messages before the backend broadcasts successful message events, and authorized users can retrieve stored history after disconnecting or restarting the application. If message storage fails, the backend reports the failure rather than confirming a successful send or broadcasting an unstored message. Unauthorized users are rejected when attempting to retrieve, send, or subscribe to protected conversation messages. These behaviors are part of the implemented MVP and its documented verification scenarios, although the available evidence does not establish that every possible failure condition or concurrency race has been tested.

The group history-access question (`UQ-04`) was resolved for the approved MVP. Current group members, including newly added or readded members, can retrieve the complete stored conversation history. Removed members lose access to protected conversation operations and their existing Socket.IO conversation-room subscriptions are revoked. Although the selected sequence models private messaging rather than group membership changes, these decisions remain relevant to its authorization and history-retrieval responsibilities. The documented verification does not establish comprehensive protection against distributed or concurrent membership races.

These observations show how the Sequence Diagram supports implementation and verification by identifying the required order of authentication, authorization, message validation, persistence, real-time delivery, and history retrieval. The revised model reflects the approved IA-06 MVP decisions while distinguishing implemented functionality from deferred features and remaining verification limitations. It represents the system's responsibilities conceptually rather than claiming that every implementation detail or concurrency scenario is depicted or verified.
