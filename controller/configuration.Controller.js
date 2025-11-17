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
    const { totalEmi, numberOfLoans, emiSchedule, income, loans } = req.body;

    // Determine if configuration should be marked as configured
    // User is considered configured if they provide at least income, totalEmi, or loan details
    const hasLoanData = Array.isArray(loans) && loans.length > 0;
    const isConfigured = !!(income || totalEmi || hasLoanData);

    // Find or create configuration
    const [configuration, created] = await db.UserConfiguration.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        totalEmi: totalEmi || null,
        numberOfLoans: numberOfLoans || 0,
        emiSchedule: emiSchedule || null,
        loans: loans || null,
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
        loans: loans !== undefined ? loans : configuration.loans,
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

const parseNumeric = (value) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

const computeMonthsToPayoff = (balance, monthlyRate, payment) => {
  if (!balance || balance <= 0 || !payment || payment <= 0) {
    return null;
  }

  if (!monthlyRate) {
    return Math.ceil(balance / payment);
  }

  const interestPortion = balance * monthlyRate;
  if (payment <= interestPortion) {
    return null;
  }

  const numerator = Math.log(payment) - Math.log(payment - interestPortion);
  const denominator = Math.log(1 + monthlyRate);

  const months = Math.ceil(numerator / denominator);
  return Number.isFinite(months) ? months : null;
};

const toISODate = (date) => date.toISOString().split("T")[0];

exports.getLoanSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const configuration = await db.UserConfiguration.findOne({
      where: { userId },
    });

    if (!configuration) {
      return res.status(404).json({
        error: "Configuration not found",
        message: "Please complete your initial configuration first",
      });
    }

    const loans = Array.isArray(configuration.loans)
      ? configuration.loans
      : [];

    const totalLoanBalance = loans.reduce(
      (sum, loan) =>
        sum + parseNumeric(loan.currentBalance ?? loan.principal ?? 0),
      0
    );

    const totalEmi = parseNumeric(configuration.totalEmi);
    const now = new Date();

    const currentMonth = now.getUTCMonth() + 1;
    const currentYear = now.getUTCFullYear();

    const paidEmiTransaction = await db.UserTransaction.findOne({
      where: {
        userId,
        month: currentMonth,
        year: currentYear,
        paidEmi: true,
      },
      order: [["transactionDate", "DESC"]],
    });

    const enrichedLoans = loans.map((loan, index) => {
      const balance = parseNumeric(loan.currentBalance ?? loan.principal ?? 0);
      const interestRate = parseNumeric(loan.interestRate);
      const monthlyRate = interestRate > 0 ? interestRate / 100 / 12 : 0;

      const proportionalShare =
        totalLoanBalance > 0 && totalEmi > 0
          ? totalEmi * (balance / totalLoanBalance)
          : 0;

      const fallbackPayment = balance > 0 ? balance / 12 : 0;
      const monthlyPayment =
        proportionalShare > 0 ? proportionalShare : fallbackPayment;

      const monthsToPayoff = computeMonthsToPayoff(
        balance,
        monthlyRate,
        monthlyPayment
      );

      const payoffDate =
        monthsToPayoff !== null
          ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthsToPayoff, 1))
          : null;

      return {
        id: loan.id || `${index}`,
        bankName: loan.bankName || "",
        loanType: loan.loanType || "",
        principal: parseNumeric(loan.principal),
        balance,
        interestRate,
        startDate: loan.startDate || null,
        currentBalance: loan.currentBalance || null,
        notes: loan.notes || "",
        monthlyPayment,
        monthsToPayoff,
        payoffDate: payoffDate ? toISODate(payoffDate) : null,
      };
    });

    res.json({
      income: configuration.income,
      totalEmi: configuration.totalEmi,
      numberOfLoans: configuration.numberOfLoans,
      totalLoanBalance,
      loans: enrichedLoans,
      emiStatus: {
        currentMonthPaid: !!paidEmiTransaction,
        paidTransactionId: paidEmiTransaction?.id || null,
        paidOn: paidEmiTransaction
          ? paidEmiTransaction.transactionDate
          : null,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};

