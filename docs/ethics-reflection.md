# Messenger Ethics Reflection

**Project:** Messenger Application  
**Student:** Sean Hamilton  
**Course:** CPS 490 - Capstone I 

**Document Status:** Draft  
**Submission Date:** October 12, 2026

---

## 1. Introduction

The purpose of this ethics reflection is to examine the potential positive and negative impacts of the proposed Messenger application and consider how those impacts could influence engineering decisions. Although the primary objective of Messenger is to allow users to communicate through private and group based messaging, the decisions made during development can also affect user privacy, safety, accessibility, and the overall experience of using the system.

The initial Messenger application will operate as a controlled prototype using existing user identities. Its functionality includes private and group messaging, group management, message history, message editing and deletion, notifications, and basic user profiles. This analysis will consider the potential impacts of these capabilities across eight dimensions: cultural, economic, environmental, global, public health, public safety, public welfare, and social.

By identifying both the benefits and potential risks associated with Messenger, we can evaluate realistic ways to reduce significant negative impacts and determine whether those concerns should influence the project's requirements, design decisions, or operational policies. The analysis will remain consistent with the current project scope while identifying areas that may require additional stakeholder clarification.

## 2. Design Impact Analysis

### 2.1 Cultural Impact

**Positive Impact**

Messenger could provide users from different cultural backgrounds with a centralized platform where they can communicate through private and group based messaging. These capabilities could support collaboration and allow users with different experiences and communication styles to participate in shared conversations. Users who benefit from these interactions would have another way to exchange information and maintain connections with others.

**Negative Impact**

Differences in language, cultural expressions, and communication styles could create misunderstandings between users. For example, a message that is understood one way by the sender could be interpreted differently by the recipient. Additionally, users who are unfamiliar with the language or terminology used within Messenger's interface could have difficulty navigating the application or participating in conversations. These limitations could negatively affect users from different linguistic or cultural backgrounds.

**Potential Mitigation**

To reduce these concerns, the development team could use clear and consistent terminology throughout Messenger's interface and avoid unnecessary language that may be difficult for some users to understand. Basic usability testing with users from different backgrounds could also help identify confusing interface elements before the prototype is finalized. These measures would not eliminate all cultural misunderstandings, but they could make the application easier to use without introducing functionality outside the current project scope.

### 2.2 Economic Impact

**Positive Impact**

Messenger could provide economic benefits by giving users a centralized platform for private and group based communication. Having these capabilities available within one application could reduce the time users spend coordinating conversations and exchanging information. Additionally, limiting the initial Messenger prototype to its agreed upon functionality could help the development team use its available time and resources more efficiently while working toward the established project deadline.

**Negative Impact**

Developing and maintaining Messenger requires development time, computing resources, and potentially additional hosting or infrastructure costs. These costs could affect the client and development team, particularly if unexpected technical problems or changes to the project requirements increase the amount of work needed. Unresolved requirements could also create additional development expenses if functionality must be redesigned or corrected after implementation.

**Potential Mitigation**

To reduce these concerns, the development team should maintain the agreed upon project scope and clarify unresolved requirements before implementing the affected functionality. Following the project milestones established in the Statement of Work could also help identify scheduling problems early and allow the team to address them before they create additional costs. These measures would help manage the resources required to develop Messenger without introducing unnecessary functionality into the prototype.

### 2.3 Environmental Impact

**Impact Assessment**

Messenger is not expected to have a significant environmental impact within the scope of the initial prototype. The application will operate in a controlled environment with limited functionality rather than as a large scale public messaging service. Although the system will require computing, storage, and network resources to process messages and maintain conversation history, its expected resource usage does not suggest an unusually significant environmental impact.

**Potential Negative Impact**

The primary environmental concern involves the energy and resources required to operate Messenger and store conversation messages. Under `NFR-03`, the system must maintain message history so that users can return to previous conversations. This requires storage resources, and unnecessary data retention or inefficient processing could increase resource consumption. However, the extent of this impact is expected to remain limited within the current prototype scope.

**Potential Mitigation**

The development team could reduce unnecessary resource consumption by avoiding redundant message storage and using computing resources efficiently. Decisions about how long messages should be retained should also consider `UQ-08`, which identifies message retention as an unresolved requirement. These measures could help limit unnecessary resource usage while preserving Messenger's required functionality.


### 2.4 Global Impact

**Impact Assessment**

Messenger is not expected to have a significant global impact within the scope of the initial prototype. The application is intended to operate in a controlled environment using existing user identities, and the current project requirements do not establish international deployment or support for users across different geographic regions. Although private and group messaging could eventually support communication between users in different countries, this potential benefit is not an established capability or objective of the current prototype.

**Potential Negative Impact**

If Messenger were expanded beyond its current environment, differences in regional privacy regulations, language requirements, and network infrastructure could create additional challenges. Users in different regions could experience difficulties accessing the application or understanding its interface, while the development team could face additional requirements related to protecting user information. However, these concerns are primarily associated with a potential future expansion rather than the currently defined prototype.

**Potential Mitigation**

To reduce these concerns, the development team should maintain the agreed upon deployment scope and avoid assuming that the prototype is suitable for international use. If broader availability becomes a future project objective, the team should clarify the applicable regional requirements and evaluate whether additional privacy, accessibility, or infrastructure considerations are necessary before expanding the system. This would allow potential global concerns to be addressed through future requirements and design decisions without introducing unnecessary functionality into the initial prototype.

### 2.5 Public Health Impact

**Impact Assessment**

Messenger could have both positive and negative effects on the well-being of individual users, although a significant public health impact is not expected within the scope of the initial prototype. Private and group based messaging could help users maintain social connections, communicate with others, and receive support through conversations. However, the application is intended to operate in a controlled environment rather than as a large scale public communication service, which limits the extent of its expected public health impact.

**Potential Negative Impact**

One potential concern is that users could experience stress or emotional distress from receiving unwanted or harmful messages. Private and group messaging allow users to communicate directly with others, but these capabilities could also be misused to send messages that negatively affect another user's well-being. Additionally, message notifications could become disruptive depending on how frequently they occur and how the notification behavior is implemented. These concerns could affect individual users even if the overall public health impact of the prototype remains limited.

**Potential Mitigation**

To reduce these concerns, the development team could consider reasonable ways for users to manage unwanted interactions and avoid unnecessary notification disruptions. The notification behavior remains unresolved under `UQ-02`, so this concern could be considered when those requirements are clarified. The team should also recognize that advanced moderation capabilities are excluded under `NFR-02`. If additional protections against harmful communication are considered necessary, they should be discussed with stakeholders before introducing new functionality or changing the agreed upon project scope.

### 2.6 Public Safety Impact

**Positive Impact**

Messenger could support public safety by allowing users to communicate information about potential safety concerns through private and group based messaging. For example, users could share information about a concerning situation with other members of a conversation. Although Messenger is not intended to function as an emergency communication system, its messaging capabilities could provide an additional way for users to exchange important information.

**Negative Impact**

One significant concern is that Messenger's communication capabilities could be misused to send threats, intimidate other users, or coordinate harmful activities. These actions could negatively affect message recipients, group members, or individuals outside the application. Another concern involves unauthorized access to conversations. Because the method for accessing existing user identities and the rules governing group membership have not been fully established, weaknesses in these areas could allow information to become available to unintended users. These risks remain relevant even though Messenger will initially operate in a controlled environment.

**Potential Mitigation**

To reduce these concerns, the development team should clarify how users access existing identities and establish appropriate rules for managing group membership and conversation access. These decisions are connected to `UQ-01`, `UQ-03`, `UQ-04`, and `UQ-10`, which identify unresolved identity, permission, message history, and security requirements. The team should also consider how harmful communication could be addressed while recognizing that advanced moderation capabilities are excluded under `NFR-02`. Any additional protections should be evaluated with stakeholders before modifying the agreed upon project scope.

### 2.7 Public Welfare Impact

**Impact Assessment**

Messenger could provide benefits to individual users by giving them a centralized platform for private and group based communication. These capabilities could help users exchange information, participate in conversations, and access previous messages when needed. However, the application is intended to operate as a controlled prototype rather than a widely available public communication service. As a result, Messenger is not expected to have a significant impact on public welfare beyond the users participating in the prototype.

**Potential Negative Impact**

One potential concern is that users who have difficulty accessing or navigating Messenger could be disadvantaged compared with other users. Additionally, group membership decisions could prevent certain users from participating in conversations or accessing information relevant to them. These concerns could affect individual users, particularly if group membership permissions are not clearly established or consistently applied. However, restricting participation in a private group is not necessarily harmful when those restrictions are appropriate and authorized.

**Potential Mitigation**

To reduce these concerns, the development team could consider basic accessibility and usability during the design and testing of Messenger's interface. The team should also clarify the group membership permissions identified under `UQ-03` and the message history access rules identified under `UQ-04`. Establishing these rules would help ensure that group membership changes are handled consistently and that users only access conversations they are permitted to view. These measures could improve the experience of individual users without introducing unnecessary functionality into the current prototype.

### 2.8 Social Impact

**Positive Impact**

Messenger could have a significant positive social impact by allowing users to communicate and maintain connections through private and group based messaging. Private conversations could support direct communication and collaboration between individuals, while group conversations could provide a shared space for multiple users to exchange information and participate in discussions. These capabilities could help users maintain relationships and interact with others through a centralized communication platform.

**Negative Impact**

One significant concern is that Messenger's communication capabilities could be misused to send unwanted or harassing messages. Users could experience repeated unwanted contact through private conversations, while group messaging could allow multiple participants to target or exclude another user. These interactions could negatively affect the individuals involved and discourage them from participating in conversations. Additionally, the current requirements do not establish whether users can voluntarily leave group conversations, which could make it more difficult for someone to avoid unwanted group interactions.

**Potential Mitigation**

To reduce these concerns, the development team should consider reasonable protections against unwanted communication and clarify the rules governing group membership. The unresolved question identified under `UQ-05` should be addressed to determine whether users need the ability to voluntarily leave group conversations. Establishing expectations for appropriate communication could also help discourage harmful behavior. Because advanced moderation capabilities are excluded under `NFR-02`, additional features such as blocking or reporting should be evaluated with stakeholders before being introduced into the prototype. These measures could help reduce harmful social interactions while maintaining consistency with the agreed upon project scope.


## 3. Connecting Ethics to Engineering

### 3.1 Unauthorized Access to Conversations

**Affected Stakeholders and Potential Harm**

One significant negative impact identified in the public safety analysis is the possibility of unauthorized access to private or group conversations. This could affect message senders, recipients, and group members whose stored messages become accessible to unintended users. Unauthorized access could expose private information, compromise the confidentiality of conversations, and reduce users' trust in Messenger.

**Proposed Mitigation**

To reduce this risk, Messenger should establish clear rules determining which users are permitted to access private conversations, group conversations, and stored message history. These rules should be enforced when messages are retrieved from storage rather than relying only on what the interface displays. Group membership changes should also follow clearly defined history access rules so that users cannot retrieve messages they are not authorized to view.

**Connection to Engineering Decisions**

This concern connects to `FR-02`, `FR-04`, and `FR-05`, which establish private messaging, group management, and conversation history. It also relates to `UQ-01`, `UQ-03`, `UQ-04`, and `UQ-10`, which identify unresolved questions involving user identities, membership permissions, history access, and security protections.

As a result of this ethical analysis, the requirements document was revised to include `FR-09 - Conversation Access Control`. This requirement establishes that private and group conversation messages must only be accessible to authorized users and that access restrictions must be enforced when messages are retrieved from storage. The corresponding acceptance criterion, `AC-09`, was also added to verify that authorized users can retrieve permitted messages while unauthorized users are denied access. These changes demonstrate how identifying a potential privacy and safety concern influenced the engineering requirements. The specific rules governing group membership and message history access still require stakeholder clarification before final acceptance testing.


### 3.2 Harassment and Unwanted Communication

**Affected Stakeholders and Potential Harm**

Another significant negative impact identified in the social impact analysis is the possibility of harassment and unwanted communication. This concern could affect private message recipients and group conversation participants who receive repeated unwanted or harmful messages. These interactions could cause emotional distress, discourage users from participating in conversations, or make them feel excluded from group discussions. Although Messenger will initially operate in a controlled environment, these risks remain relevant because communication between users is the application's primary purpose.

**Proposed Mitigation**

One potential mitigation is allowing users to voluntarily leave group conversations when they no longer want to participate. This could provide users with a way to avoid unwanted group interactions without requiring advanced moderation functionality. Establishing expectations for appropriate communication within the controlled prototype could also help discourage harassment. Additional protections, such as blocking or reporting users, could be considered if stakeholders determine that these capabilities are necessary, but they should not be assumed to be part of the current project scope.

**Connection to Engineering Decisions**

This concern connects to `FR-02`, `FR-03`, and `FR-04`, which establish private messaging, group messaging, and group membership management. It also relates to `UQ-05`, which identifies the unresolved question of whether users should be able to voluntarily leave a group conversation. Clarifying this question could influence the group management requirements and their acceptance criteria. If voluntary group leaving is approved, `FR-04` and `AC-04` should be revised to establish and verify that behavior.

The mitigation also has an operational policy implication because expectations for appropriate communication could be established for users participating in the controlled prototype. However, a formal appropriate use policy has not yet been defined and would require stakeholder agreement before adoption. Since advanced moderation capabilities are excluded under `NFR-02`, introducing blocking, reporting, or other moderation features would require additional stakeholder discussion and a review of the agreed upon project scope.

## 4. Conclusion

This ethical analysis helped identify how Messenger's design decisions could affect users beyond the application's basic functionality. Although all eight impact dimensions were considered, not every category was equally significant. The controlled scope of the prototype limits its expected environmental and global impacts, while social and public safety concerns are more relevant because the application is designed around communication between users. These concerns demonstrate that even a limited prototype can introduce potential risks involving privacy, unwanted communication, and access to information.

The analysis also demonstrated how ethical concerns can influence the engineering process. Identifying the risk of unauthorized conversation access led to the addition of `FR-09` and `AC-09` in the requirements document, establishing a requirement for restricting conversation access and a way to verify that behavior. The concern involving harassment and unwanted communication also highlighted the importance of clarifying `UQ-05` and considering appropriate-use expectations for the prototype. Overall, the analysis reinforced the importance of evaluating potential consequences, identifying realistic mitigations, and ensuring that engineering decisions remain consistent with the project's requirements and scope.

## 5. AI Assisted Work

ChatGPT was used throughout the Messenger assignment sequence to assist with developing and reviewing the Statement of Work, Requirements Engineering document, Diagrams and Analysis, and Ethics Reflection. It helped organize the documentation, clarify requirements, develop explanations, and identify potential inconsistencies between the different engineering artifacts. ChatGPT also assisted with constructing and reviewing the diagrams to ensure they represented the functionality described in the requirements. Throughout the assignment sequence, the AI assisted output was reviewed against the assignment instructions, grading rubrics, and existing project documents to ensure consistency with the project's scope.

One meaningful AI assisted recommendation came from the Ethics Reflection, where ChatGPT identified unauthorized access to private and group conversations as a potential safety and privacy concern. This recommendation was reviewed against the existing requirements, particularly `FR-02`, `FR-04`, `FR-05`, and the unresolved questions involving identity access, group membership, and security. The review identified that the requirements established messaging and conversation history functionality but did not explicitly define restrictions on who could access stored conversations. As a result, the Requirements Engineering document was revised to include `FR-09 - Conversation Access Control` and its corresponding acceptance criterion, `AC-09`. These additions established the expected access restrictions and how that behavior would be verified.

The AI assisted work was also reviewed to avoid introducing functionality that was not included in the project's agreed upon scope. For example, features such as advanced moderation, and additional messaging capabilities were not automatically added simply because ChatGPT suggested possible improvements. The ethical analysis was also reviewed to avoid exaggerating impacts that were unlikely to be significant within the controlled prototype. These reviews helped ensure that the final documentation remained consistent across the assignment sequence and that all AI generated recommendations were evaluated before being incorporated into the engineering artifacts.

