const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || "lego_ecommerce",
    });
    console.log("✅ MongoDB Atlas connected successfully");
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "LEGO E-commerce API is running!",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  });
});

// Health check route
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus =
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: mongoose.connection.db?.databaseName || "N/A",
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
});

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
app.use("/api/users", (req, res) =>
  res.json({ message: "User routes coming soon..." })
);
app.use("/api/legos", (req, res) =>
  res.json({ message: "LEGO routes coming soon..." })
);
app.use("/api/orders", (req, res) =>
  res.json({ message: "Order routes coming soon..." })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🔍 Test endpoint: http://localhost:${PORT}/api/test`);
      console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
