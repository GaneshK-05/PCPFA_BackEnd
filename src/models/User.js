import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    // Unique identifier from the external dataset
    userId: {
      type: String,
      unique: true,
      sparse: true,
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
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    // Password hash for authentication
    password: {
      type: String,
      minlength: 6,
      select: false, // Don't return password by default
    },

    // User role within the system
    role: {
      type: String,
      enum: ["admin", "manager", "developer", "tester"],
      default: "tester",
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

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
