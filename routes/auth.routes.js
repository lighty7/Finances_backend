const express = require("express");
const router = express.Router();
const authController = require("../controller/auth.Controller");
const { validateLogin } = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");

// Public routes (no authentication required)
router.post("/login", validateLogin, authController.login);
router.post("/logout", authController.logout); // Can logout without auth token

// Protected routes (authentication required)
router.get("/verify", authenticate, authController.verify);
router.get("/session", authenticate, authController.getSession);
router.get("/sessions", authenticate, authController.getActiveSessions);
router.post("/logout-all", authenticate, authController.logoutAll);

module.exports = router;


