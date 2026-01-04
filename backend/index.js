const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load env variables
dotenv.config();

const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(express.json());

// ✅ CORS configured for frontend with credentials
app.use(
  cors({
    origin: "http://localhost:5173", // your frontend URL
    credentials: true,               // allow sending JWT in headers or cookies
  })
);

// Routes
const authRoutes = require("./routes/auth");
const disasterRoutes = require("./routes/disaster");
const adminRoutes = require("./routes/admin");


app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/admin", adminRoutes);


const PORT = process.env.PORT || 5000;

// Connect DB and start server
connectDB()
  .then(() => console.log("MongoDB connected"))
  .then(() =>
    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    )
  )
  .catch((err) => console.error(err));
