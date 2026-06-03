import mongoose from "mongoose";

// Real API fields: logId, issueId, userId, action, previousStatus, newStatus, timestamp
const activityLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // The issue this log entry relates to
    issueId: {
      type: String,
      required: true,
      trim: true,
    },

    // The user who performed the action
    userId: {
      type: String,
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

    // The action performed e.g. "created", "assigned", "status_changed"
    action: {
      type: String,
      required: true,
      trim: true,
    },

    // Status before the change
    previousStatus: {
      type: String,
      trim: true,
      default: "",
    },

    // Status after the change
    newStatus: {
      type: String,
      trim: true,
      default: "",
    },

    // When the action occurred (from source data)
    timestamp: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "activitylogs",
  }
);

// Index for auditing — look up all activity for a specific issue
activityLogSchema.index({ issueId: 1, timestamp: -1 });
// Index for user activity feeds
activityLogSchema.index({ userId: 1, timestamp: -1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
