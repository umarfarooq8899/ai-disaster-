const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["general", "volunteer", "ngo", "rescue", "admin"],
      default: "general",
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Hide password from queries by default
    },
  },
  { timestamps: true }
);

// Ensure email is always unique (MongoDB index)
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);

