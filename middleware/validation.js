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
  body("loans")
    .optional()
    .isArray()
    .withMessage("Loans must be an array"),
  body("loans.*.bankName")
    .if(body("loans").isArray())
    .notEmpty()
    .withMessage("Loan bank name is required")
    .isLength({ max: 100 })
    .withMessage("Loan bank name cannot exceed 100 characters")
    .trim(),
  body("loans.*.loanType")
    .if(body("loans").isArray())
    .notEmpty()
    .withMessage("Loan type is required")
    .isLength({ max: 100 })
    .withMessage("Loan type cannot exceed 100 characters")
    .trim(),
  body("loans.*.principal")
    .if(body("loans").isArray())
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Loan principal must be a non-negative number")
    .toFloat(),
  body("loans.*.interestRate")
    .if(body("loans").isArray())
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Loan interest rate must be between 0 and 100")
    .toFloat(),
  body("loans.*.startDate")
    .if(body("loans").isArray())
    .optional()
    .isISO8601()
    .withMessage("Loan start date must be a valid ISO 8601 date"),
  body("loans.*.currentBalance")
    .if(body("loans").isArray())
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Loan current balance must be a non-negative number")
    .toFloat(),
  body("loans.*.notes")
    .if(body("loans").isArray())
    .optional()
    .isLength({ max: 500 })
    .withMessage("Loan notes cannot exceed 500 characters")
    .trim(),
];