const express = require('express');
const router = express.Router();
// Import controller functions for handling the business logic (adding and retrieving locations)
const { addLocation, getLocations } = require('../controllers/location.controller');
// Import the middleware responsible for checking user authentication
const { authenticateToken } = require('../middleware/auth.middleware');

// Initialize the Express router
// const router = express.Router(); // Already defined above, kept for context

// --- Location Routes ---

// Route: POST /locations/
// Purpose: Adds a new delivery location for the authenticated user.
router.post(
  '/', 
  authenticateToken, // Middleware: Ensures only a user with a valid token can add a location.
  addLocation         // Controller: Executes the logic to insert the new address into the database.
);

// Route: GET /locations/
// Purpose: Retrieves all saved delivery locations belonging to the authenticated user.
router.get(
  '/', 
  authenticateToken, // Middleware: Ensures the request is from a known, logged-in user.
  getLocations        // Controller: Fetches the list of addresses associated with the user ID from the token.
);

// Export the router module to be mounted in the main Express application (e.g., app.use('/locations', locationRouter)).
module.exports = router;