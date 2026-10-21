# Messenger Diagrams and Analysis

**Project:** Messenger Application  
**Student:** Sean Hamilton  
**Course:** CPS 490 - Capstone I

**Document Status:** Draft  
**Submission Date:** October 12, 2026  
**Last Revised:** October 19, 2026

---

### Revision History

| Date | Description |
|---|---|
| October 12, 2026 | Initial diagrams and analysis submitted for IA-04. |
| October 19, 2026 | Revised diagrams and analysis to align with updated Messenger requirements and IA-06 implementation expectations. |

---

## 1. Data Flow Diagram

### 1.1 Engineering Question

The Data Flow Diagram (DFD) is intended to answer the following engineering question: Where does information come from, where does it go, what transforms it, and what information must persist within the Messenger system?

The DFD shows how information moves between Messenger users, the system's main processes, and its data stores. Users interact with Messenger by registering or logging into their accounts, sending and modifying messages, managing groups, updating profiles, and requesting conversation history. The system processes these requests, verifies user identity and conversation access when required, and either stores the resulting information or returns the appropriate information to authorized users.

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
| FR-07 | P5, D3 | Provides notifications to applicable, authorized conversation participants. |
| FR-08 | P1, D1 | Retrieves and updates registered user profile information. |
| FR-09 | P1, P2, P3, P4, P5, D3 | Uses verified identity and conversation membership information to enforce access restrictions on protected operations. |
| FR-10 | P1, D1 | Authenticates registered users and establishes verified identity for protected operations. |
| FR-11 | P3, P5, D2, D3 | Delivers successfully stored messages to connected, authorized conversation participants. |
| FR-12 | P2, D3 | Retrieves and lists conversations available to the authenticated user. |
| NFR-01 | P1, P2, P3, P4, P5, D1, D3 | Supports password protection, authenticated operations, and conversation authorization. |
| NFR-03 | P3, P4, D2 | Maintains persistent conversation messages so they remain available after disconnects and backend restarts. |
| NFR-04 | P1, P2, P3, P4, P5 | Supports validation, rejection of unauthorized operations, and appropriate failure handling. |

These mappings show how Messenger's requirements depend on multiple processes and data stores. They also identify where authentication, authorization, and persistent storage must be considered together. For example, message history depends on both stored messages and verified conversation membership, while real-time delivery depends on successful message storage and authorization of the intended recipients.


### 1.3 Responsibilities and Dependencies

The DFD shows that Messenger's functionality can be divided into five main processes, each responsible for handling a different part of the system. Manage Accounts and Profiles (P1) handles user registration, login, authentication, and profile information. Manage Conversations (P2) handles private and group conversations, group creation, membership changes, and conversation discovery. Process Messages (P3) handles private and group message submissions, edits, deletions, and storage. Retrieve Message History (P4) retrieves previously stored conversation messages, while Deliver Messages and Notifications (P5) provides real-time messages and applicable notifications to connected users. Separating these responsibilities helps identify which processes handle specific requests and where information needs to be stored or retrieved.

The diagram also reveals that several processes depend on authentication and conversation membership information. Before a user can access protected conversation information, the backend must verify their identity and confirm that they are authorized to perform the requested operation. P1 establishes verified user identity, while the Conversations and Membership data store (D3) provides membership information used by the other processes to enforce access restrictions. For example, P3 must verify that a user is authorized to send a message in a conversation, and P4 must verify conversation access before returning stored messages. P2 must also enforce the appropriate permissions before processing protected conversation or membership changes. These dependencies show why authentication and authorization must be enforced consistently throughout Messenger.

Another important dependency involves message persistence and real-time delivery. When a user sends a message, P3 must successfully store it in the Messages data store (D2) before passing the stored message information to P5 for delivery through Socket.IO. If storage fails, the system must report the failure rather than indicating that the message was successfully sent. Users who are offline when messages are sent can retrieve those messages from persistent conversation history through P4 when they return. This shows how message processing, persistent storage, real-time delivery, and history retrieval work together to support reliable communication.

The DFD also shows how changes to conversation membership affect other parts of Messenger. When a user is added to or removed from a conversation, P2 updates the membership information maintained in D3. The updated information must then be reflected in authorization checks for message processing, history retrieval, and real-time delivery. A removed member must not continue receiving protected conversation events. This demonstrates that conversation management and access control are connected responsibilities rather than independent operations.


### 1.4 Ambiguities and Unresolved Questions

Constructing and reviewing the DFD helped identify several areas where Messenger depends on information or behavior that has not been fully defined in the requirements. While the diagram shows how information moves through the system, it does not establish every rule governing how that information is accessed, maintained, or delivered. Some of the original questions have since been resolved or partially resolved through the updated requirements and IA-06 implementation expectations.

One area that has been clarified involves user identities (`UQ-01`). Messenger will support registration and login for registered users, with authentication required for protected operations. However, additional decisions about account and session behavior remain documented in the requirements. Another unresolved area involves group message history (`UQ-04`). The DFD shows that retrieving conversation history depends on both stored messages and conversation membership information, but the requirements have not fully established whether newly added members can view messages sent before they joined. The backend must enforce the applicable access rules, and removed members cannot continue receiving protected conversation events.

The DFD also reveals dependencies involving notification delivery and message persistence. Messenger will use Socket.IO for real-time message delivery to connected, authorized participants, resolving the original uncertainty about the delivery mechanism (`UQ-02` and `UQ-09`). However, details such as delivery status indicators, read receipts, and certain notification behaviors remain open. Similarly, MongoDB will maintain persistent conversation messages, including messages that users retrieve after disconnecting or after a backend restart. The remaining questions under `UQ-08` concern message retention, deletion policies, and the handling of stored history when conversations are deleted.

Another important design consideration involves conversation authorization (`FR-09` and `NFR-01`). The DFD must show that access to protected messages and conversation information depends on verified user identity and conversation membership. Although the requirements establish these protections, the model raises questions about how membership changes affect access to previously stored messages and how the system consistently applies authorization across its different processes.

The revised DFD will remain consistent with the scope established in the Statement of Work and `NFR-02`. It will represent required registration, authentication, private and group messaging, conversation management, persistence, and real-time delivery without introducing unrelated features or external integrations. This helps ensure that the model reflects the Messenger system defined by the revised requirements rather than adding functionality that has not been approved.


## 2. Sequence Diagram

### 2.1 Engineering Question

The Sequence Diagram is intended to answer the following engineering question: Who communicates with whom, in what order, and what happens when the scenario does not follow only the ideal path?

The Sequence Diagram models the process of an authenticated Messenger user sending a private message to another registered user. It shows the interactions between the sender, Messenger Interface, authentication and conversation authorization, message processing, conversation information, message storage, real-time delivery, and the recipient. The scenario begins when the sender submits a private message and continues through JWT verification, account validation, conversation authorization, message validation, persistent storage, and delivery to connected, authorized participants through Socket.IO.

The diagram also shows how the recipient can retrieve stored conversation history, including messages sent while they were offline. Alternative paths demonstrate what happens when authentication fails, a user is not authorized to access the conversation, a message or conversation is invalid, or message storage fails. The history retrieval process also includes authentication, authorization, and retrieval failure paths. By modeling these interactions in order, we can better understand how Messenger handles private messaging, why certain operations must succeed before others can continue, and how the system prevents unsuccessful or unauthorized operations from being treated as successful.


### 2.2 Requirements Represented

The Sequence Diagram primarily represents the requirements related to private messaging, user authentication, conversation authorization, message persistence, real-time delivery, and conversation history. Each interaction shows how Messenger processes a private message, verifies that the operation is authorized, stores the message, and makes it available to the intended recipient.

| Requirement | Sequence Diagram Representation |
|---|---|
| FR-02 | The sender submits a private message to another registered user, Messenger stores it in the appropriate private conversation, and the recipient can retrieve the message. |
| FR-05 | The recipient requests private conversation history, which is retrieved from persistent storage after the system verifies authentication and conversation access. |
| FR-07 | Real-Time Delivery and Notifications provides an applicable notification to the connected recipient after successful message storage. |
| FR-09 | The backend verifies that the authenticated user is authorized to access the private conversation before allowing protected message operations or history retrieval. It also verifies recipient membership before real-time delivery. |
| FR-10 | The backend verifies JWT signatures and claims before looking up registered accounts. Both sender and recipient identities are established through authentication rather than trusting identity information supplied by the interface. |
| FR-11 | After successfully storing a message, Messenger uses Socket.IO to deliver it to connected, authorized conversation participants without requiring a refresh. |
| NFR-01 | Authentication and conversation authorization protect user accounts and private conversation information from unauthorized access. |
| NFR-03 | Private messages are stored persistently and remain available after users disconnect or the backend restarts. |
| NFR-04 | The system rejects invalid or unauthorized requests and handles message validation, storage, and history retrieval failures without incorrectly indicating success. |

These interactions demonstrate how Messenger's requirements work together during private messaging. They show that certain operations depend on earlier steps being completed successfully. The backend must authenticate the user and verify conversation access before processing protected requests. Messages must also be successfully stored before real-time delivery occurs. If the recipient is offline, the stored message remains available for retrieval through authenticated conversation history.


### 2.3 Responsibilities and Dependencies

The Sequence Diagram shows that private messaging involves several responsibilities that must occur in a specific order. When a sender submits a private message, the backend must first verify the JWT signature and claims, confirm that the registered account is valid, and verify that the sender is authorized to access the conversation. The sender's identity is determined from verified JWT information rather than an identifier supplied by the interface. Message Processing then retrieves the conversation details, including the conversation type and participants, from the Conversations and Membership data store. It also validates the message content before attempting storage. If authentication fails, the sender is not authorized, or the message or conversation is invalid, the system rejects the operation rather than continuing with message storage.

Another important dependency involves message persistence and real-time delivery. After the sender and conversation have been validated, Message Processing stores the private message in MongoDB. The message must be successfully stored before the backend broadcasts it to connected, authorized conversation participants through Socket.IO. If storage fails, the sender receives a failure response, and the system does not broadcast the message as successfully sent. This demonstrates why message persistence must occur before real-time delivery and why the interface must distinguish between a successful submission and an unsuccessful operation.

The diagram also shows how conversation history retrieval depends on previously stored messages and verified conversation access. When the recipient opens the private conversation, the backend authenticates the request and confirms that the recipient is an authorized participant before retrieving the stored messages. The messages are then returned through the Messenger Interface and displayed to the recipient. This also supports offline message recovery because messages sent while a recipient was disconnected remain available in persistent conversation history when they return.

Another important observation involves the relationship between real-time delivery and notification processing. After a message is successfully stored, Messenger can provide real-time message events and applicable notifications to connected, authorized participants. However, successful storage does not necessarily confirm that another user's client received or displayed the message. This distinction is important because delivery status indicators and read receipts remain unresolved under `UQ-09`. The diagram therefore establishes the required ordering of storage and broadcasting without assuming that message receipt or reading has been confirmed.


### 2.4 Ambiguities and Unresolved Questions

Constructing and reviewing the Sequence Diagram helped identify several areas where the private messaging process depends on behavior that has not been fully defined in the requirements. Although the diagram establishes the order of interactions for the selected scenario, some details still require clarification before implementation decisions can be finalized. Other questions have since been resolved or partially resolved through the updated requirements and IA-06 implementation expectations.

One area that has been clarified involves user authentication (`UQ-01` and `UQ-10`). Messenger will support registration and login for registered users, and the backend will use verified JWT information to determine the identity of the user performing a protected operation. The system must also verify conversation membership before allowing users to access protected messages or conversation information. However, decisions about JWT expiration, browser token storage, and certain additional security protections remain open.

Another area involves notification behavior and real-time message delivery (`UQ-02` and `UQ-09`). Messenger will use Socket.IO to deliver new messages to connected, authorized conversation participants after those messages have been successfully stored. This resolves the original uncertainty about whether real-time delivery is required. However, the requirements have not fully established whether the interface will display delivery status indicators, read receipts, or specific notifications for messages received while a user was offline. These details remain open and should not be assumed to be part of the implemented functionality without further decisions.

The Sequence Diagram also reveals important dependencies involving message persistence and failure handling. MongoDB will store messages before the backend broadcasts successful message events, and users will be able to retrieve stored messages after disconnecting or restarting the application. If message storage fails, the system must report the failure rather than indicating that the message was successfully sent. Similarly, unauthorized users must not be permitted to retrieve, send, or subscribe to protected conversation messages. While these behaviors are established requirements, the exact interface messages and some implementation details still need to be determined.

Another unresolved consideration involves how changes to conversation membership affect access to previous messages (`UQ-04`). The backend must enforce membership authorization and prevent removed members from continuing to receive protected real-time events. However, the requirements have not fully established whether newly added members can view messages sent before they joined a conversation. Although the selected sequence models private messaging rather than group membership changes, this question remains relevant to the authorization and history retrieval responsibilities represented in the system.

These observations show how the Sequence Diagram supports implementation planning by identifying which operations must occur in a specific order and which decisions still require clarification. The revised model reflects the established authentication, authorization, persistence, and real-time delivery requirements while keeping unresolved interface and access policies documented rather than assuming they have already been decided.
