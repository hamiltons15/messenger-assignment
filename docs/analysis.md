# Messenger Diagrams and Analysis

**Project:** Messenger Application
**Student:** Sean Hamilton
**Course:** CPS 490 - Capstone I

**Document Status:** Draft
**Submission Date:** October 12, 2026

---

## 1. Data Flow Diagram

### 1.1 Engineering Question
The Data Flow Diagram (DFD) is intended to answer the following engineering question: Where does information come from, where does it go, what transforms it, and what information must persist within the Messenger system?

The DFD shows how information moves between existing Messenger users, the system's five main processes, and its three data stores. Users provide information through actions such as sending messages, updating profiles, managing groups, and requesting conversation history. The system processes these requests and either stores the resulting information or returns the appropriate information to the user. The diagram also identifies the information that Messenger needs to maintain, including user profiles, conversation messages, and group membership information. By modeling these flows, we can better understand how the different parts of Messenger depend on one another to support the required functionality.

### 1.2 Requirements Represented

The DFD represents the functional requirements established in the Requirements Engineering document, along with the nonfunctional requirement related to message persistence. Each process is responsible for handling a specific part of Messenger's functionality, while the data stores maintain the information needed to support those operations.

| Requirement | DFD Component | Representation |
|---|---|---|
| FR-01 | P1, P2, D1 | Maintains existing user identities and provides recipient identity information for private messaging. |
| FR-02 | P2, D1, D2 | Processes private messages using existing recipient identities and stores the resulting messages. |
| FR-03 | P2, D2, D3 | Processes group messages using group membership information and stores the messages. |
| FR-04 | P3, D3 | Processes group creation and membership changes while maintaining group information. |
| FR-05 | P4, D2, D3 | Retrieves stored conversation messages using message and group membership information. |
| FR-06 | P2, D2 | Processes message edits and deletions and updates the stored message information. |
| FR-07 | P2, P5 | Uses new message and recipient information to generate notifications for applicable users. |
| FR-08 | P1, D1 | Retrieves and updates existing user profile information. |
| NFR-03 | P2, P4, D2 | Maintains conversation messages so they remain available when users return to a conversation. |

These connections show how the requirements are supported by the different processes and data stores within Messenger. They also help identify which parts of the system would be affected if a requirement changes during development.

### 1.3 Responsibilities and Dependencies

The DFD shows that Messenger's functionality can be divided into five main processes, each responsible for handling a different type of information. User profile management maintains existing user information, message processing handles private and group messages, group management maintains group membership, message history retrieves previous conversations, and notification generation produces notifications for applicable users. Separating these responsibilities helps show which processes handle specific requests and where information needs to be stored or retrieved.

The diagram also reveals that some processes depend on information maintained by other parts of the system. For example, message processing depends on existing user information to identify the intended recipient of a private message. Group messaging depends on group membership information to determine which users belong to a conversation. Similarly, retrieving group message history depends on both stored messages and group membership information. This shows that the processes cannot operate independently and must use consistent information to support the requirements.

Another important observation is that message storage connects several parts of Messenger. The message processing process updates stored messages when users send, edit, or delete them, while the message history process retrieves those messages when users return to a conversation. Notification generation also depends on information produced when a new message is processed. These relationships show why maintaining accurate message information is important for keeping conversation history and notifications consistent with the actions performed by users.

### 1.4 Ambiguities and Unresolved Questions

Constructing the DFD helped identify several areas where the system depends on information or behavior that has not been fully defined in the requirements. While the diagram shows how information moves through Messenger, it does not establish every rule governing how that information is accessed, maintained, or delivered.

One ambiguity involves existing user identities (`UQ-01`). The DFD shows that message processing depends on existing user information to identify the intended recipient of a private message. However, the requirements do not establish how users access their existing identities. Another unresolved question involves group message history (`UQ-04`). The diagram shows that retrieving group conversations depends on both stored messages and group membership information, but it does not establish whether newly added members can view earlier messages or whether removed members retain access to previous conversations.

The DFD also reveals questions about notification delivery and message persistence. The notification process depends on information from message processing, but the method used to deliver notifications remains unresolved under `UQ-02`. Similarly, the message data store supports conversation history and persistence, but `UQ-08` leaves the retention period and behavior after an application restart undefined. These questions will need to be clarified before the team can make implementation decisions that remain consistent with the requirements.

The DFD also remains consistent with the prototype constraints established in `NFR-01` and `NFR-02`. The diagram uses existing Messenger identities without introducing user registration or authentication, and it does not include external application integrations or other functionality outside the agreed upon scope. This helps ensure that the model represents the Messenger system defined in the Statement of Work rather than introducing additional features that have not been approved.



## 2. Sequence Diagram

### 2.1 Engineering Question

The Sequence Diagram is intended to answer the following engineering question: Who communicates with whom, in what order, and what happens when the scenario does not follow only the ideal path?

The Sequence Diagram models the process of an existing Messenger user sending a private message to another existing user. It shows the interactions between the sender, Messenger Interface, message processing, user profiles, message storage, notification processing, and the recipient. The scenario begins when the sender submits a private message and continues through recipient identification, message storage, notification generation, and the recipient opening the conversation to view the stored message. The diagram also includes alternative paths for when the intended recipient cannot be identified or when the message cannot be stored. By modeling these interactions in order, we can better understand how Messenger handles a private message from beginning to end and where the process may fail.

### 2.2 Requirements Represented

The Sequence Diagram primarily represents the requirements related to private messaging, existing user identities, notifications, and conversation history. Each interaction shows how Messenger uses these responsibilities to process a private message and make it available to the intended recipient.

| Requirement | Sequence Diagram Representation |
|---|---|
| FR-01 | Message Processing uses existing user profile information to identify the intended recipient before processing the private message. |
| FR-02 | The sender submits a private message, Messenger stores it for the intended recipient, and the recipient can open the conversation to view the message. |
| FR-05 | The recipient requests the private conversation history, which is retrieved from stored messages and returned through the Messenger Interface. |
| FR-07 | Notification Processing uses the new message and recipient information to generate a notification after the message is successfully stored. |
| NFR-01 | The scenario uses existing user identities without introducing registration or authentication functionality. |
| NFR-03 | The private message is stored and can be retrieved when the recipient opens the conversation. |

These interactions demonstrate how the requirements work together during a private messaging scenario. They also show that certain operations depend on earlier steps being completed successfully, such as identifying the recipient before storing a message and storing the message before generating a notification.

### 2.3 Responsibilities and Dependencies

The Sequence Diagram shows that private messaging involves several responsibilities that must occur in a specific order. When a sender submits a private message, Message Processing first uses existing user profile information to identify the intended recipient. This reveals that private messaging depends on accurate user identity information before the message can be stored. If the recipient cannot be identified, the process follows an alternative path and returns an error to the sender rather than continuing with message storage.

Another important dependency involves message storage and notification generation. The diagram shows that, in the selected scenario, Messenger successfully stores the private message before confirming that it was sent and generating a notification for the recipient. If message storage fails, the sender receives a failure response, and notification processing does not occur. This reveals that message storage is an important part of the private messaging process because later actions depend on its successful completion.

The diagram also shows how conversation history retrieval depends on previously stored messages. After the message has been stored, the recipient can open the private conversation, and the Retrieve Message History process requests the stored messages from Message Storage. These messages are then returned through the Messenger Interface and displayed to the recipient. This demonstrates how message processing and history retrieval have separate responsibilities but depend on the same stored information to support private messaging and conversation history.

### 2.4 Ambiguities and Unresolved Questions

Constructing the Sequence Diagram helped identify several areas where the private messaging process depends on behavior that has not been fully defined in the requirements. Although the diagram establishes the order of interactions for our selected scenario, some details still require clarification before implementation decisions can be made.

One unresolved question involves how users access their existing identities (`UQ-01`). The diagram shows Message Processing looking up the intended recipient using existing user profile information, but it does not establish how the sender accesses their own identity. Another ambiguity involves notification behavior (`UQ-02`). The diagram shows a notification being generated after a message is successfully stored, but the requirements do not establish the notification delivery method or guarantee that the recipient receives it immediately. The recipient opening the conversation afterward represents the selected scenario and does not mean that viewing messages depends on receiving a notification.

The diagram also reveals questions about message delivery and failure handling. Under `UQ-09`, the requirements leave certain message delivery expectations unresolved, including whether messages must be delivered in real time. The diagram shows that stored messages can be retrieved when a recipient opens a conversation, but it does not establish a delivery timing guarantee. Additionally, the diagram includes proposed failure paths for an invalid recipient and unsuccessful message storage. These paths demonstrate how Messenger could prevent unsuccessful operations from continuing, but the exact error responses have not been established as approved requirements. These behaviors should be clarified with stakeholders before implementation.





