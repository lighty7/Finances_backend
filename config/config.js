require("dotenv").config();

const env = process.env.NODE_ENV || "development";

const config = {
  development: {
    port: process.env.PORT || 3000,
    database: {
      url: process.env.DATABASE_URL,
      sync: {
        alter: true, // Auto-modify tables in development
        force: false,
      },
      logging: console.log, // Show SQL queries in development
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    cors: {
      origin: "*", // Allow all origins in development
      credentials: true,
    },
    logging: {
      level: "debug",
      showStack: true,
      showDetails: true,
    },
    errorHandling: {
      showStack: true,
      showDetails: true,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    email: {
      enabled: process.env.EMAIL_ENABLED === "true",
      from: {
        name: process.env.EMAIL_FROM_NAME || "Budget Tracker",
        address: process.env.EMAIL_FROM_ADDRESS || "noreply@budgettracker.com",
      },
      smtp: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        user: process.env.SMTP_USER || "",
        password: process.env.SMTP_PASSWORD || "",
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
      },
    },
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  },
  production: {
    port: process.env.PORT || 3000,
    database: {
      url: process.env.DATABASE_URL,
      sync: {
        alter: false, // Never auto-modify in production
        force: false,
      },
      logging: false, // Don't log SQL queries in production
      ssl: {
        require: true,
        rejectUnauthorized: true, // Strict SSL in production
      },
    },
    cors: {
      origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
        : "*", // Configure allowed origins (comma-separated list)
      credentials: true,
    },
    logging: {
      level: "error",
      showStack: false,
      showDetails: false,
    },
    errorHandling: {
      showStack: false,
      showDetails: false,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    email: {
      enabled: process.env.EMAIL_ENABLED === "true",
      from: {
        name: process.env.EMAIL_FROM_NAME || "Budget Tracker",
        address: process.env.EMAIL_FROM_ADDRESS || "noreply@budgettracker.com",
      },
      smtp: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        user: process.env.SMTP_USER || "",
        password: process.env.SMTP_PASSWORD || "",
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
      },
    },
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  },
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ERROR: ${envVar} environment variable is not set`);
    process.exit(1);
  }
}

// Get current environment config
const currentConfig = config[env];

if (!currentConfig) {
  console.error(`❌ ERROR: Invalid NODE_ENV: ${env}. Must be 'development' or 'production'`);
  process.exit(1);
}

module.exports = {
  env,
  ...currentConfig,
  isDevelopment: env === "development",
  isProduction: env === "production",
};

