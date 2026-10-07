# Messenger Requirements Engineering

**Project:** Messenger Application  
**Student:** Sean Hamilton  
**Course:** CPS 490 - Capstone I  
**Document Status:** Draft  

**Submission Date:** October 12, 2026

---

## 1. System Context


Messenger is a communication application that allows users with existing identities to communicate through private and group based messaging. The Messenger prototype system is responsible for managing private messages, group conversations, group membership, message history, message editing and deletion, notifications, and basic user profiles.

The initial Messenger prototype will operate in a controlled environment using existing user identities. User registration and authentication are outside the system boundary. The method used to access the existing identities has not yet been determined and remains an unresolved requirement. External application integrations, voice and video calling, screen sharing, and advanced moderation capabilities are also outside the system boundary.

### 1.1 Major Actors

**User:** A person using an existing Messenger identity. Users interact with Messenger to send and receive private messages, participate in group conversations, manage group membership, access message history, edit or delete messages they previously sent, receive notifications, and maintain their basic profiles.

### 1.2 External Systems

No external application or third party service integration is currently defined for the Messenger prototype. The method for accessing existing user identities and the method used to deliver notifications remain unresolved. If either decision requires interaction with an external system, the system context and related requirements will be revised accordingly.


## 2. Functional Requirements

### FR-01 - User Identification

The Messenger prototype system shall support multiple existing user identities. Each user identity shall have a unique user ID and an associated basic profile.

**Source:** Statement of Work, Section 3.1, User Identification.

### FR-02 - Private Messaging

The Messenger prototype system shall allow a user to send a private message to another existing user. The system shall make the sent message available in the private conversation between the sender and the intended recipient.

**Source:** Statement of Work, Section 3.1, Private Messaging.

### FR-03 - Group Messaging

The Messenger prototype system shall allow users to send messages within group conversations containing multiple existing user identities. The system shall make messages sent within a group conversation available to the members of that group.

**Source:** Statement of Work, Section 3.1, Group Messaging.

### FR-04 - Group Management

The Messenger prototype system shall allow a user to create a messaging group. The system shall allow users to add existing user identities to a group and remove existing user identities from a group. The system shall accurately display the current membership of the group after a membership change.

**Source:** Statement of Work, Section 3.1, Group Management.

### FR-05 - Message History

The Messenger prototype system shall allow users to access previous private and group conversations and view messages associated with those conversations. When a user returns to a previous conversation, the system shall retrieve and display the messages associated with that conversation.

**Source:** Statement of Work, Section 3.1, Message History.

### FR-06 - Message Editing and Deletion

The Messenger prototype system shall allow users to edit messages they have previously sent. The system shall display the updated message content in the correct conversation. The system shall also allow users to delete messages they have previously sent, after which the deleted message shall no longer be displayed in the conversation.

**Source:** Statement of Work, Section 3.1, Message Editing and Deletion.

### FR-07 - Message Notifications

The Messenger prototype system shall notify the intended recipient when a new private message is received. The system shall also notify applicable group members when a new message is received within a group conversation. The specific notification method and behavior remain unresolved and require stakeholder clarification before implementation.

**Source:** Statement of Work, Section 3.1, Notifications.

### FR-08 - User Profiles

The Messenger prototype system shall allow users to access and view their basic profile information. The system shall allow users to modify their basic profile information and shall display the updated information after the changes are made.

**Source:** Statement of Work, Section 3.1, User Profiles.


## 3. Non-Functional Requirements

### NFR-01 - Prototype Access Constraint

The Messenger prototype system shall operate in a controlled environment using existing user identities without providing user registration, password management, or user authentication functionality.

**Source:** Statement of Work, Sections 3.2 and 5.2, User Registration and Authentication and User Authentication.

### NFR-02 - Prototype Scope Constraint

The Messenger prototype system shall provide text based communication without providing dedicated mobile applications, external application or third party service integrations, voice or video calling, screen sharing, or advanced user roles and moderation capabilities.

**Source:** Statement of Work, Sections 3.2 and 5.2, Out of Scope and Project Scope.

### NFR-03 - Message Persistence

The Messenger prototype system shall persist conversation messages so that messages remain available when a user navigates away from a conversation and later reopens it.

**Source:** Statement of Work, Sections 3.1 and 7.2, Message History.


## 4. Acceptance Criteria

### AC-01 - User Identification

**Related Requirement:** FR-01

FR-01 will be satisfied when the Messenger prototype demonstrates support for multiple existing user identities and each demonstrated identity is associated with a unique user ID and the correct basic profile. The method used to access the existing identities must be resolved before final acceptance testing.

### AC-02 - Private Messaging

**Related Requirement:** FR-02

FR-02 will be satisfied when one existing user sends a private message to another existing user and the sent message appears in the correct private conversation and can be viewed by the intended recipient.

### AC-03 - Group Messaging

**Related Requirement:** FR-03

FR-03 will be satisfied when multiple existing users within a group conversation send messages and the sent messages appear in the correct group conversation and can be viewed by the members of that group.

### AC-04 - Group Management

**Related Requirement:** FR-04

FR-04 will be satisfied when a user creates a messaging group, adds existing users to the group, and removes existing users from the group. The Messenger prototype system must accurately reflect the resulting group membership after each change.

### AC-05 - Message History

**Related Requirements:** FR-05, NFR-03

FR-05 and NFR-03 will be satisfied when a user navigates away from a private or group conversation, later reopens that conversation, and can view the messages that were previously exchanged in the correct conversation.

### AC-06 - Message Editing and Deletion

**Related Requirement:** FR-06

FR-06 will be satisfied when a user edits a message they previously sent and the updated content appears in the correct conversation. FR-06 will also be satisfied when a user deletes a message they previously sent and the deleted message is no longer displayed in the conversation.

### AC-07 - Message Notifications

**Related Requirement:** FR-07

FR-07 will be satisfied when a new private message triggers a notification for the intended recipient and a new group message triggers a notification for the applicable group members. The specific notification method and behavior must be resolved before final acceptance testing.

### AC-08 - User Profiles

**Related Requirement:** FR-08

FR-08 will be satisfied when a user accesses and views their basic profile, modifies permitted profile information, and the Messenger prototype system correctly displays the updated profile information.


## 5. Assumptions and Unresolved Questions

### 5.1 Assumptions

#### A-01 - Existing User Identities

Existing user identities will be available for use by the Messenger prototype system. The Messenger prototype will use these existing identities rather than providing user registration or authentication functionality.


### 5.2 Unresolved Questions

#### UQ-01 - Existing Identity Access Method

How will users access the existing user identities provided to the Messenger prototype system?

The access method has not yet been determined. This decision may require revisions to FR-01, NFR-01, and AC-01 once stakeholder clarification is received.

#### UQ-02 - Notification Method and Behavior

What method will the Messenger prototype system use to notify users of new messages, and what notification behavior is required?

The notification method and behavior have not yet been determined. This includes whether notifications are provided within the Messenger prototype or through another method. This decision may require revisions to FR-07 and AC-07 once stakeholder clarification is received.

#### UQ-03 - Group Membership Permissions

Which users are permitted to add or remove existing user identities from a group conversation?

The group membership permission rules have not yet been determined. The current requirements do not define a group owner, administrator, or other privileged role. This decision may require revisions to FR-04 and AC-04 once stakeholder clarification is received.

#### UQ-04 - Group Membership and Message History Behavior

How should changes in group membership affect access to the group's message history?

It has not yet been determined whether a user added to an existing group can view messages sent before they joined or whether a user removed from a group retains access to messages from before their removal. This decision may require revisions to FR-03, FR-04, FR-05, and AC-05 once stakeholder clarification is received.

#### UQ-05 - Voluntary Group Leaving

Should a user be able to voluntarily leave a group conversation?

The current requirements define adding and removing group members but do not specify whether a user can remove themselves from a group. If voluntary group leaving is required, FR-04 and its related acceptance criteria may need to be revised to include this behavior.

#### UQ-06 - Message Editing and Deletion Behavior

What behavior is required when a user edits or deletes a previously sent message?

The current requirements do not specify whether editing or deletion is limited to a certain period of time, whether an edited message should be identified as edited, or whether a deleted message should be completely removed from view or replaced by an indication that a message was deleted. This decision may require revisions to FR-06 and AC-06 once stakeholder clarification is received.

#### UQ-07 - Basic User Profile Information

What information is included in a basic user profile, and which profile information are users permitted to modify?

The current requirements do not define the specific fields contained in a basic user profile or which fields can be modified by the user. This decision may require revisions to FR-01, FR-08, AC-01, and AC-08 once stakeholder clarification is received.

#### UQ-08 - Message History Persistence and Retention

How long must conversation messages be retained, and must message history remain available after the Messenger prototype system is restarted?

The current requirements establish that message history must remain available when a user leaves a conversation and later returns, but they do not define a message retention period or persistence behavior across system restarts. This decision may require revisions to FR-05, NFR-03, and AC-05 once stakeholder clarification is received.

#### UQ-09 - Message Delivery Behavior

What message delivery behavior is required for private and group messages?

The current requirements do not specify an expected message delivery time or how the Messenger prototype system should handle messages when a recipient is not currently using the system. The requirements also do not specify whether message delivery status information is required. This decision may require revisions to FR-02, FR-03, and their related acceptance criteria once stakeholder clarification is received.

#### UQ-10 - Security Protections

What security protections are required for the Messenger prototype system?

The Statement of Work excludes advanced encryption beyond standard security protections but does not define what standard security protections are required for the prototype. This is an ambiguity in the current project definition because the required security behavior cannot yet be stated in a specific and verifiable form. The required security behavior must be clarified before specific security requirements and acceptance criteria can be established.

## 6. Requirements Traceability

The following table traces each requirement to its source within the Statement of Work and to its related acceptance criteria where applicable.

For requirements that do not have a dedicated acceptance criterion, "Verified by prototype review" means that the completed Messenger prototype will be reviewed to confirm that it follows the stated requirement or constraint. For scope constraints, this includes confirming that capabilities explicitly identified as outside the project scope have not been implemented as part of the prototype.

| Requirement | Requirement Area | Source / Rationale | Acceptance Criteria |
|---|---|---|---|
| FR-01 | User Identification | Statement of Work, Section 3.1, User Identification | AC-01 |
| FR-02 | Private Messaging | Statement of Work, Section 3.1, Private Messaging | AC-02 |
| FR-03 | Group Messaging | Statement of Work, Section 3.1, Group Messaging | AC-03 |
| FR-04 | Group Management | Statement of Work, Section 3.1, Group Management | AC-04 |
| FR-05 | Message History | Statement of Work, Section 3.1, Message History | AC-05 |
| FR-06 | Message Editing and Deletion | Statement of Work, Section 3.1, Message Editing and Deletion | AC-06 |
| FR-07 | Message Notifications | Statement of Work, Section 3.1, Notifications | AC-07 |
| FR-08 | User Profiles | Statement of Work, Section 3.1, User Profiles | AC-08 |
| NFR-01 | Prototype Access Constraint | Statement of Work, Sections 3.2 and 5.2, User Registration and Authentication and User Authentication | AC-01 and prototype review |
| NFR-02 | Prototype Scope Constraint | Statement of Work, Sections 3.2 and 5.2, Project Scope | N/A - Verified by prototype review |
| NFR-03 | Message Persistence | Statement of Work, Sections 3.1 and 7.2, Message History | AC-05 |




