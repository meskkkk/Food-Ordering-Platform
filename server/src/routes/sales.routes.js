const express = require('express');
const router = express.Router();
// Import the controller functions responsible for executing the sales aggregation queries
const { getDailySales, getMonthlySales } = require('../controllers/sales.controller');

// Initialize the Express router
// const router = express.Router(); // Already defined above, kept for context

// --- Analytics/Sales Routes ---

// Route: GET /analytics/daily
// Purpose: Retrieves total sales and order counts, grouped by day (daily report).
// Access: Typically protected (e.g., admin role required), though not enforced in this file.
router.get('/daily', getDailySales);

// Route: GET /analytics/monthly
// Purpose: Retrieves total sales and order counts, grouped by month (monthly report).
// Access: Typically protected (e.g., admin role required), though not enforced in this file.
router.get('/monthly', getMonthlySales);

// Export the router module to be mounted in the main Express application.
module.exports = router;