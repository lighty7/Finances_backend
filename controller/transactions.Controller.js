const db = require("../models");
const { validationResult } = require("express-validator");

const parseFloatSafe = (value) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

const buildSummary = (transactions) => {
  return transactions.reduce(
    (acc, txn) => {
      const amount = parseFloatSafe(txn.amount);
      if (txn.type === "INCOME") {
        acc.incomeTotal += amount;
      } else if (txn.type === "EXPENSE") {
        acc.expenseTotal += amount;
      }

      if (txn.paidEmi && !acc.paidEmiTransactionId) {
        acc.emiPaid = true;
        acc.paidEmiTransactionId = txn.id;
      }

      return acc;
    },
    {
      incomeTotal: 0,
      expenseTotal: 0,
      emiPaid: false,
      paidEmiTransactionId: null,
    }
  );
};

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
    return true;
  }
  return false;
};

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year } = req.query;

    const where = { userId };
    if (month) {
      where.month = parseInt(month, 10);
    }
    if (year) {
      where.year = parseInt(year, 10);
    }

    const transactions = await db.UserTransaction.findAll({
      where,
      order: [
        ["transactionDate", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    const summary = buildSummary(transactions);

    res.json({
      transactions,
      summary,
      period: {
        month: where.month || null,
        year: where.year || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch transactions",
      message: error.message,
    });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) {
      return;
    }

    const userId = req.user.id;
    const {
      type,
      amount,
      category,
      description,
      transactionDate,
      loanReference,
      paidEmi = false,
    } = req.body;

    const parsedDate = new Date(transactionDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Invalid transaction date",
      });
    }

    const month = parsedDate.getUTCMonth() + 1;
    const year = parsedDate.getUTCFullYear();

    const transaction = await db.UserTransaction.create({
      userId,
      type,
      amount,
      category: category || null,
      description: description || null,
      transactionDate: parsedDate,
      month,
      year,
      loanReference: loanReference || null,
      paidEmi: !!paidEmi,
    });

    res.status(201).json({
      message: "Transaction recorded",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create transaction",
      message: error.message,
    });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    if (handleValidationErrors(req, res)) {
      return;
    }

    const userId = req.user.id;
    const transactionId = req.params.id;

    const transaction = await db.UserTransaction.findOne({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      return res.status(404).json({
        error: "Transaction not found",
        message: "Unable to find transaction for this user",
      });
    }

    const updates = {};
    const allowedFields = [
      "type",
      "amount",
      "category",
      "description",
      "transactionDate",
      "loanReference",
      "paidEmi",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.transactionDate) {
      const parsedDate = new Date(updates.transactionDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Invalid transaction date",
        });
      }
      updates.transactionDate = parsedDate;
      updates.month = parsedDate.getUTCMonth() + 1;
      updates.year = parsedDate.getUTCFullYear();
    }

    await transaction.update(updates);

    res.json({
      message: "Transaction updated",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update transaction",
      message: error.message,
    });
  }
};


