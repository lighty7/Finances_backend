const express = require("express");
const router = express.Router();
const configurationController = require("../controller/configuration.Controller");
const { validateConfiguration } = require("../middleware/validation");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.get(
  "/",
  authenticate,
  configurationController.getConfiguration
);

router.get(
  "/status",
  authenticate,
  configurationController.checkConfigurationStatus
);

router.post(
  "/",
  authenticate,
  validateConfiguration,
  configurationController.createOrUpdateConfiguration
);

router.put(
  "/",
  authenticate,
  validateConfiguration,
  configurationController.createOrUpdateConfiguration
);

module.exports = router;

