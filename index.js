const express = require("express");
const cors = require("cors");
const db = require("./models");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const userRoutes = require("./routes/users.routes");

// Use routes
app.use("/api/users", userRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Budget Tracker API",
    version: "1.0.0",
    status: "running",
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware - must be last
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database connected`);
      console.log(`📝 API endpoints:`);
      console.log(`   - GET    http://localhost:${PORT}/api/users`);
      console.log(`   - POST   http://localhost:${PORT}/api/users`);
      console.log(`   - GET    http://localhost:${PORT}/api/users/:id`);
      console.log(`   - PUT    http://localhost:${PORT}/api/users/:id`);
      console.log(`   - DELETE http://localhost:${PORT}/api/users/:id`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });

module.exports = app;
