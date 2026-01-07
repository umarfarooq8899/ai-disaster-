const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// ================== CONFIG ==================
dotenv.config();
const app = express();

// ================== MIDDLEWARE ==================
// ✅ Correct CORS for credentials (IMPORTANT)
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend (Vite)
    credentials: true,
  })
);

app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev"));  // HTTP request logging

// ================== DATABASE ==================
const DB_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-disaster";

mongoose
  .connect(DB_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => {
    console.error("MongoDB connection error ❌", err);
    process.exit(1);
  });

// ================== ROUTES ==================

// Auth routes (login / register)
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Users routes
const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

// Disasters routes
const disasterRoutes = require("./routes/disasters");
app.use("/api/disasters", disasterRoutes);

// Alerts routes
const alertRoutes = require("./routes/alerts");
app.use("/api/alerts", alertRoutes);

// Admin routes
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

// Statistics routes
const statisticsRoutes = require("./routes/statistics");
app.use("/api/statistics", statisticsRoutes);

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// ================== ERROR HANDLING ==================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error ❌" });
});

// ================== SERVER ==================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} 🚀`);
});
