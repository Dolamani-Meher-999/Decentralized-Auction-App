const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes - make sure these paths are correct
const itemRoutes = require("./routes/items");
const seedRoutes = require("./routes/seed");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/auction_dapp")
.then(() => console.log("✅ MongoDB connected successfully"))
.catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes - Make sure these are functions
console.log("itemRoutes type:", typeof itemRoutes);
console.log("seedRoutes type:", typeof seedRoutes);

app.use("/api/items", itemRoutes);
app.use("/api/seed", seedRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date(),
    message: "Auction DApp Backend is running" 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});