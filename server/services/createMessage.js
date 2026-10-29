const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const validateMessage = require("../utils/validateMessage");

async function createMessage(conversationId, userId, content) {
  if (
    typeof conversationId !== "string" ||
    !mongoose.isObjectIdOrHexString(conversationId)
  ) {
    return {
      ok: false,
      code: "invalid_conversation"
    };
  }

  const validationError = validateMessage(content);

  if (validationError) {
    return {
      ok: false,
      code: "invalid_content",
      error: validationError
    };
  }

  if (mongoose.connection.readyState !== 1) {
     return {
       ok: false,
       code: "server_error"
     };
   }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    members: userId
  });

  if (!conversation) {
    return {
      ok: false,
      code: "not_found"
    };
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    content: content.trim()
  });

  return {
    ok: true,
    message: {
      id: message._id.toString(),
      conversation: message.conversation.toString(),
      sender: message.sender.toString(),
      content: message.content,
      createdAt: message.createdAt
    }
  };
}

module.exports = createMessage;
