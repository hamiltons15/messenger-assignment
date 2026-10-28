require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const User = require("./models/User");
const Conversation = require("./models/Conversation");

const validateRegistration = require("./utils/validateRegistration");
const { hashPassword, verifyPassword } = require("./utils/password");
const { createToken } = require("./utils/token");

const requireAuth = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;

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

app.post("/api/conversations", requireDatabase, requireAuth, async (req, res) => {
  const { type, members } = req.body || {};

  if (type !== "direct" && type !== "group") {
    return res.status(400).json({
      error: "Conversation type must be direct or group."
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

    if (type === "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          members: { $all: members, $size: 2 }
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
      createdBy: req.userId
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
    console.error("Conversation creation failed:", error);

    return res.status(500).json({
      error: "Unable to create conversation."
    });
  }

});

async function startServer() {
  try {
    if (!PORT || !MONGO_URI) {
      throw new Error("PORT and MONGO_URI must be configured");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await User.init();
    console.log("User indexes initialized");

    app.listen(PORT, () => {
      console.log(`Messenger server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start Messenger:", error.message);
    process.exit(1);
  }
}

startServer();