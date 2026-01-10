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
    origin: "http://localhost:5173", // your Vite frontend
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

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
const Volunteer = require("./models/Volunteer"); // adjust paths
const Mission = require("./models/Mission");
const Alert = require("./models/Alert");

// ================= ROUTES =================
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/disasters", require("./routes/disasters"));
app.use("/api/alerts", require("./routes/alerts"));
app.use("/api/statistics", require("./routes/statistics"));

// ================= RESCUE MODULE =================
const auth = require("./middleware/auth");
const rescueOnly = require("./middleware/rescueOnly"); // make sure this allows rescue_coordinator
const rescueRoutes = require("./routes/rescue");
app.use("/api/rescue", auth, rescueRoutes);
app.use("/api/volunteer", require("./routes/volunteer"));

// ================= STATS CARD ROUTE =================
app.get("/api/statscard/dashboard", auth, rescueOnly, async (req, res) => {
  try {
    // Get counts from your collections
    const activeVolunteers = await Volunteer.countDocuments({ active: true });
    const ongoingMissions = await Mission.countDocuments({ status: "ongoing" });
    const resolvedMissions = await Mission.countDocuments({ status: "resolved" });
    const activeAlerts = await Alert.countDocuments({ active: true });

    res.json({
      activeVolunteers,
      ongoingMissions,
      resolvedMissions,
      activeAlerts,
    });
  } catch (err) {
    console.error("Statscard dashboard error:", err);
    res.status(500).json({ message: "Failed to load rescue dashboard data ❌" });
  }
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// ================= ERROR HANDLING =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found ❌" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error ❌" });
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT} 🚀`)
);
