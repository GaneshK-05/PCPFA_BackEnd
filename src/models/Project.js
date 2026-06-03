import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    // Unique identifier from the external dataset
    projectId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Project title
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Detailed description of the project
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Current lifecycle status of the project
    status: {
      type: String,
      enum: ["active", "inactive", "archived", "completed"],
      default: "active",
    },

    // Reference to the user who owns/manages the project
    ownerId: {
      type: String,
      trim: true,
    },

    // Start date of the project
    startDate: {
      type: Date,
    },

    // Expected or actual end date of the project
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "projects",
  }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
