// index.js
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");
const monitoringService = require("./services/monitoringService");

dotenv.config();
const app = express();

// Start AI Monitoring Service
monitoringService.startMonitoring();

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: true, // Allow any origin dynamically (required for Vercel deployment)
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
const compression = require("compression");
app.use(compression()); // Enable gzip compression

app.use(express.json());
app.use(morgan("dev"));

// ================= RATE LIMITING =================
const rateLimit = require("express-rate-limit");

// Trust proxy for Railway reverse proxy
app.set("trust proxy", 1);

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", globalLimiter);

// Stricter Rate Limiter for Auth Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login/register requests per windowMs
  message: "Too many authentication attempts, please try again later",
});
app.use("/api/auth", authLimiter);

app.use("/uploads", express.static("uploads", {
  maxAge: "1d", // Cache static assets for 1 day
  setHeaders: (res, path) => {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
}));

// ================= DATABASE =================
const DB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster";
mongoose
  .connect(DB_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => {
    console.error("MongoDB connection failed ❌", err);
    process.exit(1);
  });

// ================= MODELS =================
require("./models/User");
require("./models/Volunteer");
require("./models/Mission");
require("./models/Alert");
require("./models/Disaster");
require("./models/AidAssignment");
require("./models/Resource");
require("./models/Statistic");
require("./models/StatusLog");
require("./models/RescueOrganization");
require("./models/NgoOrganization");
require("./models/Admin");
require("./models/GlobalStats"); // Cumulative statistics
// ================= ROUTES =================
app.use("/api/auth", require("./routes/auth")); // <-- register & login
app.use("/api/users", require("./routes/users"));
app.use("/api/disasters", require("./routes/disasters"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/statistics", require("./routes/statistics"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/organizations", require("./routes/organizationRoutes"));
app.use("/api/ai", require("./routes/ai"));

// ================= RESCUE & VOLUNTEER ROUTES =================
const { protect } = require("./middleware/auth");
const rescueOnly = require("./middleware/rescueOnly");
app.use("/api/rescue", protect, rescueOnly, require("./routes/rescue"));
app.use("/api/ngo", protect, require("./middleware/ngoOnly"), require("./routes/ngo"));
app.use("/api/volunteer", protect, require("./routes/volunteer"));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// ================= ERROR HANDLING =================
// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

// 500 handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error ❌" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} 🚀`));

