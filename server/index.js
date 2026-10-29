require("dotenv").config();

const http = require("node:http");
const { Server } = require("socket.io");
const express = require("express");
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (typeof token !== "string" || !token) {
    return next(new Error("Authentication required."));
  }

  try {
    const decoded = verifyToken(token);

    if (
      typeof decoded.sub !== "string" ||
      !mongoose.isObjectIdOrHexString(decoded.sub)
    ) {
      return next(new Error("Invalid authentication token."));
    }

    socket.data.userId = decoded.sub;
    socket.data.tokenExpiresAt = decoded.exp * 1000;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return next(new Error("Invalid or expired authentication token."));
    }

    next(error);
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.data.userId}`);

  const millisecondsUntilExpiration =
    socket.data.tokenExpiresAt - Date.now();


  if (millisecondsUntilExpiration <= 0) {
    socket.disconnect(true);
    return;
  }

  const expirationTimer = setTimeout(() => {
    socket.disconnect(true);
  }, millisecondsUntilExpiration);

  socket.on("conversation:join", async (conversationId, acknowledge) => {
    const reply =
      typeof acknowledge === "function" ? acknowledge : () => {};

    if (!mongoose.isObjectIdOrHexString(conversationId)) {
      return reply({
        ok: false,
        error: "Invalid conversation ID."
      });
    }

    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: socket.data.userId
      });

      if (!conversation) {
        return reply({
          ok: false,
          error: "Conversation not found."
        });
      }

      const room = `conversation:${conversation._id.toString()}`;

      await socket.join(room);

      return reply({
        ok: true,
        conversationId: conversation._id.toString()
      });
    } catch (error) {
      console.error("Socket conversation join failed:", error);

      return reply({
        ok: false,
        error: "Unable to join conversation."
      });
    }
  });

  socket.on("message:send", async (payload, acknowledge) => {
     const reply =
       typeof acknowledge === "function" ? acknowledge : () => {};

     try {
       const result = await createMessage(
         payload?.conversationId,
         socket.data.userId,
         payload?.content
       );

       if (!result.ok) {
         return reply(result);
       }

       reply({
         ok: true,
         message: result.message
       });

       io.to(`conversation:${result.message.conversation}`).emit(
         "message:new",
         result.message
       );
     } catch (error) {
       console.error("Socket message creation failed:", error);

       reply({
         ok: false,
         code: "server_error"
       });
     }
   });

  socket.on("conversation:leave", async (conversationId, acknowledge) => {
      const reply =
        typeof acknowledge === "function" ? acknowledge : () => {};

      if (
        typeof conversationId !== "string" ||
        !mongoose.isObjectIdOrHexString(conversationId)
      ) {
        return reply({
          ok: false,
          error: "Invalid conversation ID."
        });
      }

      try {
        await socket.leave(`conversation:${conversationId}`);

        return reply({
          ok: true
        });
      } catch (error) {
        console.error("Socket conversation leave failed:", error);

        return reply({
          ok: false,
          error: "Unable to leave conversation."
        });
      }
    });

  socket.on("disconnect", () => {
    clearTimeout(expirationTimer);
  });
});

const mongoose = require("mongoose");
const User = require("./models/User");
const Conversation = require("./models/Conversation");
const validateRegistration = require("./utils/validateRegistration");
const { hashPassword, verifyPassword } = require("./utils/password");
const { createToken, verifyToken } = require("./utils/token");
const requireAuth = require("./middleware/auth");
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;
const Message = require("./models/Message");
const validateConversation = require("./utils/validateConversation");
const validateMessage = require("./utils/validateMessage");
const createMessage = require("./services/createMessage");


app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database unavailable."
    });
  }

  next();
}

app.post("/api/auth/register", requireDatabase, async (req, res) => {
  try {
    const { username, password } = req.body || {};

    const validationError = validateRegistration(username, password);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await User.findOne({
      username: normalizedUsername
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Username is already registered."
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      username: normalizedUsername,
      passwordHash
    });

    return res.status(201).json({
      message: "Account registered successfully.",
      user: {
        id: user._id,
        username: user.username
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Username is already registered."
      });
    }

    console.error("Registration failed:", error);

    return res.status(500).json({
      error: "Unable to register account."
    });
  }
});

app.post("/api/auth/login", requireDatabase, async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Username and password are required."
      });
    }

    const normalizedUsername = username.trim().toLowerCase();

    const user = await User.findOne({
      username: normalizedUsername
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password."
      });
    }

    const passwordMatches = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid username or password."
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      error: "Unable to log in."
    });
  }
});

app.get("/api/auth/me", requireDatabase, requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({
        error: "Authenticated user no longer exists."
      });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error("Current user lookup failed:", error);

    return res.status(500).json({
      error: "Unable to retrieve current user."
    });
  }
});

app.get("/api/conversations", requireDatabase, requireAuth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: req.userId
    })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      conversations: conversations.map((conversation) => ({
        id: conversation._id.toString(),
        type: conversation.type,
        name: conversation.name || null,
        members: conversation.members.map((member) => member.toString()),
        createdBy: conversation.createdBy.toString(),
        createdAt: conversation.createdAt
      }))
    });
  } catch (error) {
    console.error("Conversation listing failed:", error);

    return res.status(500).json({
      error: "Unable to retrieve conversations."
    });
  }
});

app.post("/api/conversations", requireDatabase, requireAuth, async (req, res) => {
  const { type, members } = req.body || {};

  const validationError = validateConversation(type, members);

   if (validationError) {
     return res.status(400).json({
       error: validationError
     });
   }

  if (!Array.isArray(members) || members.length === 0) {
    return res.status(400).json({
      error: "Conversation members must be a nonempty array."
    });
  }

  if (
    !members.every(member =>
      typeof member === "string" &&
      mongoose.isObjectIdOrHexString(member)
    )
  ) {
    return res.status(400).json({
      error: "Every conversation member must have a valid user ID."
    });
  }

  if (type === "direct" && members.length !== 2) {
    return res.status(400).json({
      error: "Direct conversations require exactly 2 members."
    });
  }

  if (type === "group" && members.length < 3) {
    return res.status(400).json({
      error: "Group conversations require at least 3 members."
    });
  }

  if (new Set(members).size !== members.length) {
    return res.status(400).json({
      error: "Conversation members must be unique."
    });
  }

  if (!members.includes(req.userId)) {
    return res.status(403).json({
      error: "You must be a member of the conversation."
    });
  }

  try {
    const existingMembers = await User.countDocuments({
      _id: { $in: members }
    });

    if (existingMembers !== members.length) {
        return res.status(400).json({
          error: "One or more conversation members do not exist."
        });
      }

    const directKey = type === "direct"
      ? members.map(member => member.toLowerCase()).sort().join(":")
      : undefined;

    if (type === "direct") {
      const existingConversation = await Conversation.findOne({
        type: "direct",
        directKey
      });

      if (existingConversation) {
        return res.status(409).json({
          error: "A direct conversation already exists between these users."
        });
      }
    }

    const conversation = await Conversation.create({
      type,
      members,
      createdBy: req.userId,
      ...(type == "direct" ? { directKey } : {})
    });

    return res.status(201).json({
      message: "Conversation created successfully.",
      conversation: {
        id: conversation._id.toString(),
        type: conversation.type,
        members: conversation.members,
        createdBy: conversation.createdBy
      }
    });

  } catch (error) {
    if (
      type === "direct" &&
      error.code === 11000 &&
      (error.keyPattern?.directKey || error.keyValue?.directKey)
    ) {
      return res.status(409).json({
        error: "A direct conversation already exists between these users."
      });
    }

    console.error("Conversation creation failed:", error);

    return res.status(500).json({
      error: "Unable to create conversation."
    });
  }

});

app.post(
  "/api/conversations/:conversationId/members",
  requireDatabase,
  requireAuth,
  async (req, res) => {
    const { conversationId } = req.params;
    const { userId } = req.body || {};

    if (!mongoose.isObjectIdOrHexString(conversationId)) {
      return res.status(400).json({
        error: "Invalid conversation ID."
      });
    }

    if (
      typeof userId !== "string" ||
      !mongoose.isObjectIdOrHexString(userId)
    ) {
      return res.status(400).json({
        error: "Invalid user ID."
      });
    }

    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        type: "group"
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Group conversation not found."
        });
      }

      if (conversation.createdBy.toString() !== req.userId) {
        return res.status(403).json({
          error: "Only the group creator can manage members."
        });
      }

      const userExists = await User.exists({ _id: userId });

      if (!userExists) {
        return res.status(400).json({
          error: "User does not exist."
        });
      }

      const updated = await Conversation.findOneAndUpdate(
        {
          _id: conversationId,
          type: "group",
          createdBy: req.userId,
          members: { $ne: userId }
        },
        {
          $addToSet: { members: userId }
        },
        {
          returnDocument: "after",
          runValidators: true
        }
      );

      if (!updated) {
        return res.status(409).json({
          error: "User is already a group member."
        });
      }

      return res.status(200).json({
        message: "Group member added successfully.",
        conversation: {
          id: updated._id.toString(),
          type: updated.type,
          members: updated.members.map(id => id.toString()),
          createdBy: updated.createdBy.toString()
        }
      });
    } catch (error) {
      console.error("Adding group member failed:", error);

      return res.status(500).json({
        error: "Unable to add group member."
      });
    }
  }
);

app.delete(
  "/api/conversations/:conversationId/members/:userId",
  requireDatabase,
  requireAuth,
  async (req, res) => {
    const { conversationId, userId } = req.params;

    if (
      !mongoose.isObjectIdOrHexString(conversationId) ||
      !mongoose.isObjectIdOrHexString(userId)
    ) {
      return res.status(400).json({
        error: "Invalid conversation or user ID."
      });
    }

    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        type: "group"
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Group conversation not found."
        });
      }

      if (conversation.createdBy.toString() !== req.userId) {
        return res.status(403).json({
          error: "Only the group creator can manage members."
        });
      }

      if (conversation.createdBy.toString() === userId) {
        return res.status(403).json({
          error: "The group creator cannot be removed."
        });
      }

      if (
        !conversation.members.some(
          member => member.toString() === userId
        )
      ) {
        return res.status(404).json({
          error: "User is not a group member."
        });
      }

      const updated = await Conversation.findOneAndUpdate(
        {
          _id: conversationId,
          type: "group",
          createdBy: req.userId,
          members: userId,
          $expr: {
            $gt: [{ $size: "$members" }, 3]
          }
        },
        {
          $pull: { members: userId }
        },
        {
          returnDocument: "after",
          runValidators: true
        }
      );

      if (!updated) {
        return res.status(409).json({
          error: "Group must retain at least 3 members."
        });
      }

      const userRoom = `user:${userId}`;
      const conversationRoom = `conversation:${conversationId}`;

      io.in(userRoom).socketsLeave(conversationRoom);

      return res.status(200).json({
        message: "Group member removed successfully.",
        conversation: {
          id: updated._id.toString(),
          type: updated.type,
          members: updated.members.map(id => id.toString()),
          createdBy: updated.createdBy.toString()
        }
      });
    } catch (error) {
      console.error("Removing group member failed:", error);

      return res.status(500).json({
        error: "Unable to remove group member."
      });
    }
  }
);


app.post(
  "/api/conversations/:conversationId/messages",
  requireDatabase,
  requireAuth,
  async (req, res) => {
    try {
      const result = await createMessage(
        req.params.conversationId,
        req.userId,
        req.body?.content
      );

      if (!result.ok) {
        if (result.code === "invalid_conversation") {
          return res.status(400).json({
            error: "Invalid conversation ID."
          });
        }

        if (result.code === "invalid_content") {
          return res.status(400).json({
            error: result.error
          });
        }

        if (result.code === "not_found") {
          return res.status(404).json({
            error: "Conversation not found."
          });
        }
      }

      io.to(`conversation:${result.message.conversation}`).emit(
        "message:new",
        result.message
      );

      return res.status(201).json({
        message: result.message
      });
    } catch (error) {
      console.error("Message creation failed:", error);

      return res.status(500).json({
        error: "Unable to send message."
      });
    }
  }
);

app.get(
  "/api/conversations/:conversationId/messages",
  requireDatabase,
  requireAuth,
  async (req, res) => {
    const { conversationId } = req.params;
    const { before } = req.query;

    if (!mongoose.isObjectIdOrHexString(conversationId)) {
      return res.status(400).json({
        error: "Invalid conversation ID."
      });
    }

    if (
      before !== undefined &&
      (
        typeof before !== "string" ||
        !mongoose.isObjectIdOrHexString(before)
      )
    ) {
      return res.status(400).json({
        error: "Invalid history cursor."
      });
    }

    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: req.userId
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found."
        });
      }

      const filter = {
        conversation: conversation._id
      };

      if (before) {
        const cursorMessage = await Message.findOne({
          _id: before,
          conversation: conversation._id
        }).select("createdAt");

        if (!cursorMessage) {
          return res.status(400).json({
            error: "Invalid history cursor."
          });
        }

        filter.$or = [
          {
            createdAt: { $lt: cursorMessage.createdAt }
          },
          {
            createdAt: cursorMessage.createdAt,
            _id: { $lt: cursorMessage._id }
          }
        ];
      }

      const messages = await Message.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .limit(6)
        .lean();

      const hasMore = messages.length > 5;
      const page = messages.slice(0, 5);

      return res.status(200).json({
        messages: page.map((message) => ({
          id: message._id.toString(),
          conversation: message.conversation.toString(),
          sender: message.sender.toString(),
          content: message.deletedAt
            ? "This message was deleted."
            : message.content,
          createdAt: message.createdAt,
          editedAt: message.editedAt || null,
          deletedAt: message.deletedAt || null
        })),
        nextCursor: hasMore
          ? page[page.length - 1]._id.toString()
          : null
      });
    } catch (error) {
      console.error("Message history retrieval failed:", error);

      return res.status(500).json({
        error: "Unable to retrieve message history."
      });
    }
  }
);

app.patch(
  "/api/conversations/:conversationId/messages/:messageId",
  requireDatabase,
  requireAuth,
  async (req, res) => {
    const { conversationId, messageId } = req.params;
    const { content } = req.body || {};

    if (
      !mongoose.isObjectIdOrHexString(conversationId) ||
      !mongoose.isObjectIdOrHexString(messageId)
    ) {
      return res.status(400).json({
        error: "Invalid conversation or message ID."
      });
    }

    const validationError = validateMessage(content);

       if (validationError) {
         return res.status(400).json({
           error: validationError
         });
       }

    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: req.userId
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found."
        });
      }

      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          conversation: conversation._id,
          sender: req.userId,
          deletedAt: null
        },
        {
          $set: {
            content: content.trim(),
            editedAt: new Date()
          }
        },
        {
          returnDocument: "after",
          runValidators: true
        }
      );

      if (!message) {
        return res.status(404).json({
          error: "Message not found or cannot be edited."
        });
      }

      return res.status(200).json({
        message: {
          id: message._id.toString(),
          conversation: message.conversation.toString(),
          sender: message.sender.toString(),
          content: message.content,
          createdAt: message.createdAt,
          editedAt: message.editedAt,
          deletedAt: message.deletedAt
        }
      });
    } catch (error) {
      console.error("Message editing failed:", error);

      return res.status(500).json({
        error: "Unable to edit message."
      });
    }
  }
);

app.delete(
  "/api/conversations/:conversationId/messages/:messageId",
  requireDatabase,
  requireAuth,
  async (req, res) => {
    const { conversationId, messageId } = req.params;

    if (
      !mongoose.isObjectIdOrHexString(conversationId) ||
      !mongoose.isObjectIdOrHexString(messageId)
    ) {
      return res.status(400).json({
        error: "Invalid conversation or message ID."
      });
    }

    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        members: req.userId
      });

      if (!conversation) {
        return res.status(404).json({
          error: "Conversation not found."
        });
      }

      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          conversation: conversation._id,
          sender: req.userId,
          deletedAt: null
        },
        {
          $set: {
            content: "This message was deleted.",
            deletedAt: new Date()
          }
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!message) {
        return res.status(404).json({
          error: "Message not found or already deleted."
        });
      }

      return res.status(200).json({
        message: {
          id: message._id.toString(),
          conversation: message.conversation.toString(),
          sender: message.sender.toString(),
          content: message.content,
          createdAt: message.createdAt,
          editedAt: message.editedAt,
          deletedAt: message.deletedAt
        }
      });
    } catch (error) {
      console.error("Message deletion failed:", error);

      return res.status(500).json({
        error: "Unable to delete message."
      });
    }
  }
);

async function startServer() {
  try {
    if (!PORT || !MONGO_URI) {
      throw new Error("PORT and MONGO_URI must be configured");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await User.init();
    console.log("User indexes initialized");

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start Messenger:", error.message);
    process.exit(1);
  }
}

startServer();