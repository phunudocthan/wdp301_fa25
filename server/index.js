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
    // Test database connection
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

// Import models for testing
const User = require('./models/User');
const Theme = require('./models/Theme');
const AgeRange = require('./models/AgeRange');
const Difficulty = require('./models/Difficulty');
const Lego = require('./models/Lego');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Voucher = require('./models/Voucher');

// Database test endpoints
app.get('/api/database/stats', async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      themes: await Theme.countDocuments(),
      ageRanges: await AgeRange.countDocuments(),
      difficulties: await Difficulty.countDocuments(),
      legos: await Lego.countDocuments(),
      orders: await Order.countDocuments(),
      reviews: await Review.countDocuments(),
      vouchers: await Voucher.countDocuments(),
      collections: await mongoose.connection.db.listCollections().toArray()
    };
    
    res.json({
      message: 'Database statistics',
      database: mongoose.connection.db.databaseName,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/database/legos', async (req, res) => {
  try {
    const legos = await Lego.find({ status: 'active' })
      .populate('themeId', 'name description')
      .populate('ageRangeId', 'label minAge maxAge')
      .populate('difficultyId', 'label description')
      .populate('sellerId', 'name email role')
      .limit(10)
      .sort({ createdAt: -1 });
    
    res.json({
      message: 'Sample LEGO products',
      count: legos.length,
      legos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/database/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password') // Exclude password
      .limit(10)
      .sort({ createdAt: -1 });
    
    res.json({
      message: 'Sample users',
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes placeholder
app.use("/api/auth", (req, res) =>
  res.json({ message: "Auth routes coming soon..." })
);
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
