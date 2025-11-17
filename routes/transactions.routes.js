const express = require("express");
const router = express.Router();
const transactionsController = require("../controller/transactions.Controller");
const { authenticate } = require("../middleware/auth");
const {
  validateTransactionCreate,
  validateTransactionUpdate,
} = require("../middleware/validation");

router.get("/", authenticate, transactionsController.getTransactions);
router.post(
  "/",
  authenticate,
  validateTransactionCreate,
  transactionsController.createTransaction
);
router.put(
  "/:id",
  authenticate,
  validateTransactionUpdate,
  transactionsController.updateTransaction
);

module.exports = router;


