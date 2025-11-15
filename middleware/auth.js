const jwt = require("jsonwebtoken");
const config = require("../config/config");
const db = require("../models");

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No authorization header provided",
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if session exists and is active
    const session = await db.UserSessions.findOne({
      where: {
        token: token,
        userId: decoded.userId,
        isActive: true,
      },
    });

    if (!session) {
      return res.status(401).json({
        error: "Invalid session",
        message: "Session not found or has been logged out",
      });
    }

    // Get user
    const user = await db.Users.findByPk(decoded.userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(401).json({
        error: "User not found",
        message: "User associated with this token no longer exists",
      });
    }

    // Update last activity
    await session.update({
      lastActivity: new Date(),
    });

    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
        message: "Token is malformed or invalid",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Please login again",
      });
    }

    return res.status(500).json({
      error: "Authentication error",
      message: "An error occurred during authentication",
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if valid token exists
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const session = await db.UserSessions.findOne({
      where: {
        token: token,
        userId: decoded.userId,
        isActive: true,
      },
    });

    if (session) {
      const user = await db.Users.findByPk(decoded.userId, {
        attributes: { exclude: ["password"] },
      });
      if (user) {
        req.user = user;
        req.session = session;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
};

