const mongoose = require("mongoose");
const crypto = require("crypto");

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
      select: false,
    },

    // 🔐 Forgot Password fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Ensure email is always unique
userSchema.index({ email: 1 }, { unique: true });

/**
 * Generate reset password token
 */
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token & save to DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token expires in 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken; // send RAW token via email
};

module.exports = mongoose.model("User", userSchema);

