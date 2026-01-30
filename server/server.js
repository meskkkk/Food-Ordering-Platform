require("dotenv").config(); // Load environment variables from .env file into process.env
const express = require("express");
const cors = require("cors"); // Import CORS middleware for handling cross-origin requests
const initializeDatabase = require("./src/database/db"); // Function to connect and initialize the database

// Import Routes
const authRoutes = require("./src/routes/auth.routes"); // Routes for registration and login
const userRoutes = require("./src/routes/user.routes"); // Routes for user profile updates
const restaurantRoutes = require("./src/routes/restaurant.routes"); // Public routes for fetching restaurants/items
const orderRoutes = require("./src/routes/order.routes"); // Routes for creating and viewing orders
const locationRoutes = require("./src/routes/location.routes"); // Routes for managing user addresses
const salesRoutes = require("./src/routes/sales.routes"); // Routes for fetching sales analytics
const reviewsRoutes = require("./src/routes/reviews.routes"); // Routes for fetching/submitting reviews
const adminRoutes = require("./src/routes/admin.routes"); // Routes for administrative CRUD operations (e.g., managing items)
const {
  autoUpdateOrderStatuses, // Background function to automatically change order statuses
} = require("./src/controllers/order.controller");

const app = express();
const PORT = process.env.PORT || 3000; // Define the server port

// --- Global Middleware Setup ---
app.use(cors()); // Enable CORS for all routes (allows frontend to connect)
app.use(express.json()); // Body Parser: Enables Express to parse incoming requests with JSON payloads
// ------------------------------

/**
 * Initializes the database connection and starts the Express server.
 */
async function startServer() {
  try {
    // 1. Database Initialization: Connects to the database and creates necessary tables.
    const db = await initializeDatabase();

    // Store the database connection pool locally on the Express app object,
    // making it accessible to controllers via req.app.locals.db.
    app.locals.db = db;
    console.log("Database connected and attached.");

    // 2. Route Mounting: Attaching the imported route handlers to specific URL prefixes.
    app.use("/api/auth", authRoutes); // e.g., /api/auth/login
    app.use("/users", userRoutes);
    app.use("/locations", locationRoutes);
    app.use("/restaurants", restaurantRoutes);
    app.use("/orders", orderRoutes);
    app.use("/sales", salesRoutes);
    app.use("/reviews", reviewsRoutes);
    app.use("/admin", adminRoutes);

    // 3. Static File Server: Serves files from the 'uploads' directory
    // This allows images uploaded via Multer to be accessed publicly (e.g., http://localhost:3000/uploads/image.jpg)
    app.use("/uploads", express.static("uploads"));

    // Auto-update order statuses every 30 seconds
    // Runs a background task to simulate the order lifecycle progression.
    setInterval(async () => {
      await autoUpdateOrderStatuses(db);
    }, 30000); // 30 seconds

    // 4. Test Route (Root endpoint check)
    app.get("/", (req, res) => {
      res.send("Food Service API is running");
    });

    // 5. Start Server: Begins listening for incoming HTTP requests.
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    // Critical error: Log failure and exit the process.
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();