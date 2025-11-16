const db = require("../models");
const { validationResult } = require("express-validator");

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

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      error: "Duplicate entry",
      message: "Configuration already exists for this user",
    });
  }

  const config = require("../config/config");
  return res.status(500).json({
    error: "Internal server error",
    message: config.errorHandling.showDetails
      ? error.message
      : "An error occurred while processing your request",
  });
};

/**
 * Get user's configuration
 */
exports.getConfiguration = async (req, res) => {
  try {
    const userId = req.user.id;

    const configuration = await db.UserConfiguration.findOne({
      where: { userId },
    });

    if (!configuration) {
      return res.status(200).json({
        configuration: null,
        isConfigured: false,
      });
    }

    res.status(200).json({
      configuration: configuration,
      isConfigured: configuration.isConfigured,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Check if user has configured
 */
exports.checkConfigurationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const configuration = await db.UserConfiguration.findOne({
      where: { userId },
      attributes: ["isConfigured"],
    });

    res.status(200).json({
      isConfigured: configuration ? configuration.isConfigured : false,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Create or update user configuration
 */
exports.createOrUpdateConfiguration = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }

    const userId = req.user.id;
    const { totalEmi, numberOfLoans, emiSchedule, income } = req.body;

    // Determine if configuration should be marked as configured
    // User is considered configured if they provide at least income or totalEmi
    const isConfigured = !!(income || totalEmi);

    // Find or create configuration
    const [configuration, created] = await db.UserConfiguration.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        totalEmi: totalEmi || null,
        numberOfLoans: numberOfLoans || 0,
        emiSchedule: emiSchedule || null,
        income: income || null,
        isConfigured,
      },
    });

    // If configuration exists, update it
    if (!created) {
      await configuration.update({
        totalEmi: totalEmi !== undefined ? totalEmi : configuration.totalEmi,
        numberOfLoans:
          numberOfLoans !== undefined
            ? numberOfLoans
            : configuration.numberOfLoans,
        emiSchedule:
          emiSchedule !== undefined ? emiSchedule : configuration.emiSchedule,
        income: income !== undefined ? income : configuration.income,
        isConfigured: isConfigured || configuration.isConfigured,
      });
    }

    res.status(created ? 201 : 200).json({
      message: created
        ? "Configuration created successfully"
        : "Configuration updated successfully",
      configuration: configuration,
      isConfigured: configuration.isConfigured,
    });
  } catch (error) {
    handleError(error, res);
  }
};

