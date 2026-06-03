import mongoose from "mongoose";

// Real API fields: commentId, issueId, userId, message, createdAt
const commentSchema = new mongoose.Schema(
  {
    commentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    issueId: {
      type: String,
      required: true,
      trim: true,
    },

    // API field is userId (not authorId)
    userId: {
      type: String,
      required: true,
      trim: true,
    },

    // Mongoose ObjectId relationships (Phase 8)
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // API field is message (not content)
    message: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional threading support
    parentCommentId: {
      type: String,
      trim: true,
      default: null,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "comments",
  }
);

// Index for fast retrieval of all comments on a specific issue
commentSchema.index({ issueId: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;
