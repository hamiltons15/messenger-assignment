require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const User = require("./models/User");
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

app.post("/api/auth/register", async (req, res) => {
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

app.post("/api/auth/login", async (req, res) => {
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

app.get("/api/auth/me", requireAuth, async (req, res) => {
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

async function startServer() {
  try {
    if (!PORT || !MONGO_URI) {
      throw new Error("PORT and MONGO_URI must be configured");
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Messenger server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start Messenger:", error.message);
    process.exit(1);
  }
}

startServer();