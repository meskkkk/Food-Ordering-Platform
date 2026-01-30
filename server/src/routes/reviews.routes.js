const express = require("express");
const router = express.Router();
const {
  getItemRatings, // Controller function to calculate and fetch item ratings
  submitReview,   // Controller function to process and insert a new review
} = require("../controllers/reviews.controller");
const { authenticateToken } = require("../middleware/auth.middleware"); // Middleware for JWT verification

// Initialize the Express router
// const router = express.Router(); // Already defined above, kept for context

// --- Review/Rating Routes ---

// Route: GET /reviews/ratings
// Purpose: Fetches calculated average ratings and review counts for all menu items.
// Access: Public. Does not require user authentication.
router.get("/ratings", getItemRatings);

// Route: POST /reviews/:id/review
// Purpose: Submits a new review for the restaurant specified by ':id'.
// Access: Protected. Requires a valid JWT token to identify the user who is submitting the review.
router.post(
  "/:id/review", 
  authenticateToken, // Middleware: Ensures the user is logged in (req.user is populated)
  submitReview       // Controller: Processes the rating, validates ownership (if order ID is provided), and saves the review.
);

// Export the router module to be mounted in the main Express application.
module.exports = router;