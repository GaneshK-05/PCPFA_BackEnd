import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    // Unique identifier from the external dataset
    issueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Short title of the issue
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Detailed description of the bug or issue
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Reference to the parent project
    projectId: {
      type: String,
      required: true,
      trim: true,
    },

    // User who reported this issue
    reporterId: {
      type: String,
      trim: true,
    },

    // Mongoose ObjectId relationships (Phase 8)
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Current workflow status
    status: {
      type: String,
      enum: ["open", "in-progress", "testing", "resolved", "done", "closed", "reopened"],
      default: "open",
    },

    // Severity/impact level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    // Type of issue
    type: {
      type: String,
      enum: ["bug", "feature", "improvement", "task", "question"],
      default: "bug",
    },

    // Target milestone or version
    version: {
      type: String,
      trim: true,
    },

    // Date the issue was resolved (if applicable)
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "issues",
  }
);

// Compound index for project-specific issue lookups
issueSchema.index({ projectId: 1, status: 1 });

const Issue = mongoose.model("Issue", issueSchema);
export default Issue;
