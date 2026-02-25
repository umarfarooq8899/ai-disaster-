const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["general", "volunteer", "admin", "rescue", "ngo", "rescue_coordinator", "ngo_coordinator"],
      default: "general",
    },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
    profileCompleted: { type: Boolean, default: function () { return this.role !== "volunteer"; } },
    organizationType: { type: String, enum: ["NgoOrganization", "RescueOrganization", null], default: null },
    organization: { type: mongoose.Schema.Types.ObjectId, refPath: "organizationType", default: null },
    profilePicture: { type: String, default: null },
  },
  { timestamps: true }
);

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
