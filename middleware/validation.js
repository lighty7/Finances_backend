const { body } = require("express-validator");

// Validation rules for user creation and updates
exports.validateUser = [
  body("userName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username cannot be empty")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters"),
  body("emailId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters"),
];

// Validation rules for user creation (all fields required)
exports.validateUserCreate = [
  body("userName")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username must be between 3 and 50 characters"),
  body("emailId")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 100 })
    .withMessage("Password must be between 6 and 100 characters"),
];

// Validation rules for login
exports.validateLogin = [
  body("emailId")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  body("deviceId")
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Device ID must be between 1 and 255 characters"),
];

// Validation rules for configuration
exports.validateConfiguration = [
  body("totalEmi")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total EMI must be a positive number")
    .toFloat(),
  body("numberOfLoans")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Number of loans must be a non-negative integer")
    .toInt(),
  body("emiSchedule")
    .optional()
    .isArray()
    .withMessage("EMI schedule must be an array"),
  body("emiSchedule.*.date")
    .if(body("emiSchedule").isArray())
    .optional()
    .isISO8601()
    .withMessage("EMI schedule date must be a valid ISO 8601 date"),
  body("emiSchedule.*.amount")
    .if(body("emiSchedule").isArray())
    .optional()
    .isFloat({ min: 0 })
    .withMessage("EMI schedule amount must be a positive number")
    .toFloat(),
  body("income")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Income must be a positive number")
    .toFloat(),
];