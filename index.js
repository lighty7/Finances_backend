const express = require("express");
const cors = require("cors");
const db = require("./models");
const config = require("./config/config");
const { verifyConnection: verifyEmailConnection } = require("./utils/emailService");

const app = express();

// Trust proxy to get real client IP (important for IP extraction)
app.set('trust proxy', true);

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware removed

// Import routes
const userRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
const configurationRoutes = require("./routes/configuration.routes");
const transactionRoutes = require("./routes/transactions.routes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/config", configurationRoutes);
app.use("/api/transactions", transactionRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Budget Tracker API",
    version: "1.0.0",
    status: "running",
    environment: config.env,
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
  res.status(err.status || 500).json({
    error: "Internal server error",
    message: config.errorHandling.showDetails
      ? err.message
      : "An error occurred while processing your request",
    ...(config.errorHandling.showStack && { stack: err.stack }),
  });
});

// Initialize database and start server
db.initialize()
  .then(async () => {
    // Verify email connection if enabled
    if (config.email.enabled) {
      await verifyEmailConnection();
    }

    app.listen(config.port, () => {
      // Server started - database connection status is logged in models/index.js
    });
  })
  .catch((err) => {
    // Database initialization failed - error is logged in models/index.js
    process.exit(1);
  });

module.exports = app;
