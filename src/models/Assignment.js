import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    // Unique identifier from the external dataset
    assignmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Reference to the issue being assigned
    issueId: {
      type: String,
      required: true,
      trim: true,
    },

    // Reference to the user who is assigned
    userId: {
      type: String,
      required: true,
      trim: true,
    },

    // User who performed the assignment action
    assignedBy: {
      type: String,
      trim: true,
    },

    // Date when the assignment was created
    assignedAt: {
      type: Date,
      default: Date.now,
    },

    // Current status of the assignment
    status: {
      type: String,
      enum: ["active", "reassigned", "removed"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "assignments",
  }
);

// Prevent the same user from being assigned to the same issue twice
assignmentSchema.index({ issueId: 1, userId: 1 }, { unique: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);
export default Assignment;
