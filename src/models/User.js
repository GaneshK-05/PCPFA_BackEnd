import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Unique identifier from the external dataset
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Full display name of the user
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Email — used as a unique login identifier
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // User role within the system
    role: {
      type: String,
      enum: ["admin", "manager", "developer", "tester", "viewer"],
      default: "viewer",
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
    // Collection name in MongoDB
    collection: "users",
  }
);

const User = mongoose.model("User", userSchema);
export default User;
