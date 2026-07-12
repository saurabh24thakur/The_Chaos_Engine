import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Clerk User ID
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Basic Information
    firstName: {
      type: String,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },

    imageUrl: {
      type: String,
      default: "",
    },

    // Platform Information
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Credits
    credits: {
      type: Number,
      default: 100,
      min: 0,
    },

    // Subscription
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // User Preferences
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "system",
      },

      defaultAgent: {
        type: String,
        default: "chat",
      },
    },

    // Usage
    totalRequests: {
      type: Number,
      default: 0,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);