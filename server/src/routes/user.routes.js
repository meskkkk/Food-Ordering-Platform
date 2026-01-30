const express = require("express");
const router = express.Router();
// Import the controller function containing the business logic for user updates
const userController = require("../controllers/user.controller");
// Import the authentication middleware required for securing routes
const authMiddleware = require("../middleware/auth.middleware");

// Initialize the Express router
// const router = express.Router(); // Already defined above, kept for context

// --- User Routes ---

// Test route
// Purpose: A simple, unprotected endpoint to verify that the router is loaded correctly.
// Endpoint: GET /users/
router.get("/", (req, res) => {
  res.send("User routes working");
});

// Update user profile
// Purpose: Allows an authenticated user to update their profile details.
// Endpoint: PUT /users/:id
router.put(
  "/:id",
  // 1. Middleware: Ensures the request has a valid JWT token.
  // This verifies the user's identity before allowing modification.
  authMiddleware.authenticateToken,
  // 2. Controller Handler: Executes the database logic to update the user record.
  userController.updateUser
);

// Export the router module to be mounted in the main Express application.
module.exports = router;