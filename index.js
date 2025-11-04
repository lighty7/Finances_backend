const express = require("express");
const cors = require("cors");
const db = require("./models");
const config = require("./config/config");
const { verifyConnection: verifyEmailConnection } = require("./utils/emailService");

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (only in development)
if (config.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Import routes
const userRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

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
  if (config.errorHandling.showStack) {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }

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
    } else {
      console.log("📧 Email service is disabled (set EMAIL_ENABLED=true to enable)");
    }

    app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Environment: ${config.env.toUpperCase()}`);
      console.log(`📊 Database connected`);
      if (config.isDevelopment) {
        console.log(`📝 API endpoints:`);
        console.log(`   Auth:`);
        console.log(`   - POST   http://localhost:${config.port}/api/auth/login`);
        console.log(`   - POST   http://localhost:${config.port}/api/auth/logout`);
        console.log(`   - GET    http://localhost:${config.port}/api/auth/verify`);
        console.log(`   - GET    http://localhost:${config.port}/api/auth/session`);
        console.log(`   - GET    http://localhost:${config.port}/api/auth/sessions`);
        console.log(`   - POST   http://localhost:${config.port}/api/auth/logout-all`);
        console.log(`   Users:`);
        console.log(`   - POST   http://localhost:${config.port}/api/users (register)`);
        console.log(`   - POST   http://localhost:${config.port}/api/users/verify-email (verify email)`);
        console.log(`   - POST   http://localhost:${config.port}/api/users/resend-verification (resend verification)`);
        console.log(`   - GET    http://localhost:${config.port}/api/users (protected)`);
        console.log(`   - GET    http://localhost:${config.port}/api/users/:id (protected)`);
        console.log(`   - PUT    http://localhost:${config.port}/api/users/:id (protected)`);
        console.log(`   - DELETE http://localhost:${config.port}/api/users/:id (protected)`);
      }
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });

module.exports = app;
