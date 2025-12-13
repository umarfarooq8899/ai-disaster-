const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env variables
dotenv.config();

const connectDB = require("./config/db"); // ✅ FIXED: Add this import

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const disasterRoutes = require("./routes/disaster");

app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`) // ✅ FIXED: added backticks
  );
});

