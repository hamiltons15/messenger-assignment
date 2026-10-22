const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["direct", "group"]
    },

    members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      required: true,
      validate: {
        validator: function (members) {
          if (!Array.isArray(members)) {
            return false;
          }

          const uniqueMembers = new Set(
            members.map((member) => member.toString())
          );

          if (uniqueMembers.size !== members.length) {
            return false;
          }

          if (
            this.createdBy &&
            !uniqueMembers.has(this.createdBy.toString())
          ) {
            return false;
          }

          if (this.type === "direct") {
            return members.length === 2;
          }

          if (this.type === "group") {
            return members.length >= 3;
          }

          return false;
        },
        message: "Direct conversations require 2 distinct members; groups require at least 3 distinct members. The creator must also be a member."
      }
    },

    name: {
      type: String,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
