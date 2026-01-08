const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    // ✅ Role updated for Rescue Module
    role: {
      type: String,
      enum: ["general", "volunteer", "admin", "rescue_coordinator"],
      default: "general",
    },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },

    // ✅ Link user to Rescue Organization (optional, only for coordinators)
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RescueOrganization",
      required: function () {
        return this.role === "rescue_coordinator";
      },
    },
  },
  { timestamps: true }
);

// ✅ Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("User", userSchema);
