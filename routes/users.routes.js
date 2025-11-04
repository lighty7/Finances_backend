const express = require("express");
const router = express.Router();
const userController = require("../controller/user.Controller");
const { validateUser, validateUserCreate } = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");
const { body } = require("express-validator");

// Public routes (no auth required)
router.post("/", validateUserCreate, userController.createUser);
router.post("/verify-email", [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Verification token is required"),
], userController.verifyEmail);
router.post("/resend-verification", [
  body("emailId")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
], userController.resendVerification);

// Protected routes (authentication required)
router.get("/", authenticate, userController.getAllUsers);
router.get("/:id", authenticate, userController.getUserById);
router.put("/:id", authenticate, validateUser, userController.updateUser);
router.delete("/:id", authenticate, userController.deleteUser);

module.exports = router;
