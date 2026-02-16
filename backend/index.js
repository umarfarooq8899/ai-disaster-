// index.js
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();
const app = express();

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
const compression = require("compression");
app.use(compression()); // Enable gzip compression

app.use(express.json());
app.use(morgan("dev"));
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
require("./models/Prediction");
require("./models/GlobalStats"); // Cumulative statistics
// ================= ROUTES =================
app.use("/api/auth", require("./routes/auth")); // <-- register & login
app.use("/api/users", require("./routes/users"));
app.use("/api/disasters", require("./routes/disasters"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/statistics", require("./routes/statistics"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/organizations", require("./routes/organizationRoutes"));
app.use("/api/predictions", require("./routes/predictionRoutes"));

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
 
