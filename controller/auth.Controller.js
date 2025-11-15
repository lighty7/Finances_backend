const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const { getClientIp, getDeviceInfo } = require("../utils/ipHelper");
const config = require("../config/config");
const { sendEmail, templates } = require("../utils/emailService");

// Helper function to handle errors
const handleError = (error, res) => {
  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  const isDevelopment = config.isDevelopment;
  return res.status(500).json({
    error: "Internal server error",
    message: isDevelopment ? error.message : "An error occurred while processing your request",
  });
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { emailId, password, deviceId } = req.body;

    // Find user by email
    const user = await db.Users.findOne({
      where: { emailId },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Email or password is incorrect",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        error: "Email not verified",
        message: "Please verify your email address before logging in. Check your inbox for the verification email.",
        emailNotVerified: true,
        emailId: user.emailId,
      });
    }

    // Get client IP and device info
    const ipAddress = getClientIp(req);
    const deviceInfo = getDeviceInfo(req);
    const systemDeviceId = deviceId || uuidv4(); // Use provided deviceId or generate new one

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      emailId: user.emailId,
      deviceId: systemDeviceId,
    };

    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    // Create or update session
    const [session, created] = await db.UserSessions.findOrCreate({
      where: {
        userId: user.id,
        deviceId: systemDeviceId,
        isActive: true,
      },
      defaults: {
        userId: user.id,
        deviceId: systemDeviceId,
        ipAddress: ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceInfo: deviceInfo,
        token: token,
        isActive: true,
        lastActivity: new Date(),
      },
    });

    // If session exists, update it
    if (!created) {
      await session.update({
        token: token,
        ipAddress: ipAddress,
        userAgent: deviceInfo.userAgent,
        deviceInfo: deviceInfo,
        isActive: true,
        lastActivity: new Date(),
        loggedOutAt: null,
      });
    }

    // Send login notification email (async, don't wait for it)
    sendEmail({
      to: user.emailId,
      ...templates.loginNotification(
        user.userName,
        ipAddress,
        deviceInfo,
        new Date().toLocaleString()
      ),
    }).catch(() => {
      // Email sending failed - silently continue
    });

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        userName: user.userName,
        emailId: user.emailId,
      },
      deviceId: systemDeviceId,
      session: {
        id: session.id,
        ipAddress: ipAddress,
        lastActivity: session.lastActivity,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
  try {
    // Get token from request (should be authenticated)
    const token = req.token || req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({
        error: "No token provided",
        message: "Token is required for logout",
      });
    }

    // Find active session
    const session = await db.UserSessions.findOne({
      where: {
        token: token,
        isActive: true,
      },
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        message: "Session already logged out or invalid",
      });
    }

    // Deactivate session
    await session.update({
      isActive: false,
      loggedOutAt: new Date(),
    });

    res.status(200).json({
      message: "Logout successful",
      loggedOutAt: session.loggedOutAt,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Logout from all devices
 */
exports.logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const ipAddress = getClientIp(req);

    // Deactivate all active sessions for this user
    const result = await db.UserSessions.update(
      {
        isActive: false,
        loggedOutAt: new Date(),
      },
      {
        where: {
          userId: userId,
          isActive: true,
        },
      }
    );

    res.status(200).json({
      message: "Logged out from all devices",
      sessionsTerminated: result[0],
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get current user session info
 */
exports.getSession = async (req, res) => {
  try {
    const session = await db.UserSessions.findByPk(req.session.id, {
      attributes: { exclude: ["token"] },
    });

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
      });
    }

    res.status(200).json({
      session: session,
      user: req.user,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get all active sessions for current user
 */
exports.getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await db.UserSessions.findAll({
      where: {
        userId: userId,
        isActive: true,
      },
      attributes: { exclude: ["token"] },
      order: [["lastActivity", "DESC"]],
    });

    res.status(200).json({
      sessions: sessions,
      count: sessions.length,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Verify token and return user info
 */
exports.verify = async (req, res) => {
  try {
    // User is already authenticated by middleware
    res.status(200).json({
      message: "Token is valid",
      user: req.user,
      session: {
        id: req.session.id,
        deviceId: req.session.deviceId,
        ipAddress: req.session.ipAddress,
        lastActivity: req.session.lastActivity,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

