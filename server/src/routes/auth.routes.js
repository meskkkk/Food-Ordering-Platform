const express = require("express");
const router = express.Router();
// Import the controller functions that handle the core business logic (registration, login, profile retrieval)
const authController = require("../controllers/auth.controller");
// Import the middleware functions responsible for security checks (JWT verification, role checks, etc.)
const authMiddleware = require("../middleware/auth.middleware");

// --- Public Authentication Routes ---

// Route: POST /auth/register
// Allows new users to create an account. No authentication required.
router.post("/register", authController.registerUser);

// Route: POST /auth/login
// Allows existing users to log in and receive an authentication token (JWT). No authentication required.
router.post("/login", authController.loginUser);

// --- Protected Route Example ---

// Route: GET /auth/profile
// Fetches the profile data of the currently authenticated user.
router.get(
  "/profile",
  // 1. Middleware Chain Start: Runs the JWT verification first.
  // This middleware checks the token, decodes the user payload, and attaches it to req.user.
  authMiddleware.authenticateToken,
  // 2. Controller Handler: Runs only if the token is valid.
  // This function retrieves the user's data using the ID attached by the middleware.
  authController.getProfile
);

// Export the router module to be mounted in the main Express application.
module.exports = router;