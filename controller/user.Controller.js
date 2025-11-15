const db = require("../models");
const { validationResult } = require("express-validator");
const { sendEmail, templates } = require("../utils/emailService");
const crypto = require("crypto");
const config = require("../config/config");

// Helper function to handle errors
const handleError = (error, res) => {
  // Handle Sequelize validation errors
  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      error: "Validation error",
      details: error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      })),
    });
  }

  // Handle Sequelize unique constraint errors
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      error: "Duplicate entry",
      message: "A user with this email already exists",
    });
  }

  // Handle Sequelize database errors
  if (error.name === "SequelizeDatabaseError") {
    return res.status(500).json({
      error: "Database error",
      message: "An error occurred while processing your request",
    });
  }

  // Default error response (don't expose internal error details in production)
  const config = require("../config/config");
  return res.status(500).json({
    error: "Internal server error",
    message: config.errorHandling.showDetails
      ? error.message
      : "An error occurred while processing your request",
  });
};

// Create a new user
exports.createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { userName, emailId, password } = req.body;

    // Check if user with email already exists
    const existingUser = await db.Users.findOne({ where: { emailId } });
    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        message: "A user with this email already exists",
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours from now

    const newUser = await db.Users.create({
      userName,
      emailId,
      password,
      isVerified: false,
      verificationToken: verificationToken,
      verificationTokenExpiry: verificationTokenExpiry,
    });

    // Create verification URL
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

    // Send verification email (async, don't wait for it)
    sendEmail({
      to: emailId,
      ...templates.verification(userName, verificationUrl),
    }).catch(() => {
      // Email sending failed - silently continue
    });

    // Password is automatically excluded by toJSON hook
    res.status(201).json({
      message: "User created successfully. Please check your email to verify your account.",
      user: newUser,
      verificationEmailSent: true,
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.Users.findAll({
      attributes: { exclude: ["password"] }, // Explicitly exclude password
    });
    res.json(users);
  } catch (error) {
    handleError(error, res);
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await db.Users.findByPk(id, {
      attributes: { exclude: ["password"] }, // Explicitly exclude password
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { userName, emailId, password } = req.body;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await db.Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is being updated and if it already exists
    if (emailId && emailId !== user.emailId) {
      const existingUser = await db.Users.findOne({ where: { emailId } });
      if (existingUser) {
        return res.status(409).json({
          error: "Email already exists",
          message: "A user with this email already exists",
        });
      }
    }

    // Only update fields that are provided
    const updateData = {};
    if (userName) updateData.userName = userName;
    if (emailId) updateData.emailId = emailId;
    if (password) updateData.password = password;

    await user.update(updateData);

    // Password is automatically excluded by toJSON hook
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    handleError(error, res);
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: "Verification token is required",
        message: "Please provide a verification token",
      });
    }

    // Find user by verification token
    const user = await db.Users.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(404).json({
        error: "Invalid token",
        message: "Verification token is invalid or has already been used",
      });
    }

    // Check if token has expired
    if (user.verificationTokenExpiry < new Date()) {
      return res.status(400).json({
        error: "Token expired",
        message: "Verification token has expired. Please request a new verification email.",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        error: "Already verified",
        message: "This email address has already been verified",
      });
    }

    // Verify the user
    await user.update({
      isVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    res.status(200).json({
      message: "Email verified successfully. You can now login to your account.",
      user: {
        id: user.id,
        userName: user.userName,
        emailId: user.emailId,
        isVerified: true,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { emailId } = req.body;

    if (!emailId) {
      return res.status(400).json({
        error: "Email is required",
        message: "Please provide your email address",
      });
    }

    // Find user by email
    const user = await db.Users.findOne({
      where: { emailId },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        message: "If an account exists with this email, a verification email has been sent.",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        error: "Already verified",
        message: "This email address has already been verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 hours from now

    // Update user with new token
    await user.update({
      verificationToken: verificationToken,
      verificationTokenExpiry: verificationTokenExpiry,
    });

    // Create verification URL
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

    // Send verification email (async, don't wait for it)
    sendEmail({
      to: emailId,
      ...templates.verification(user.userName, verificationUrl),
    }).catch(() => {
      // Email sending failed - silently continue
    });

    res.status(200).json({
      message: "Verification email has been sent. Please check your inbox.",
    });
  } catch (error) {
    handleError(error, res);
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const user = await db.Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    handleError(error, res);
  }
};
