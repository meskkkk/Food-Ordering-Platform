const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// 1. Import BOTH controllers
const restaurantController = require('../controllers/restaurant.controller'); // Handles public read access
const adminController = require('../controllers/admin.controller'); // Handles administrative write access (CRUD)

// 2. Setup Multer (File Uploads)
const multer = require('multer');

// Ensure uploads folder exists: Critical step for local file storage
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure how uploaded files should be stored on the disk
const storage = multer.diskStorage({
  // Defines the destination directory
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  // Generates a unique filename using a 'rest-' prefix, timestamp, and original extension
  filename: (req, file, cb) => {
    cb(null, 'rest-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize Multer with the storage configuration
const upload = multer({ storage: storage });

// --- ROUTES ---

// READ (Public) - These routes are typically public-facing and do not require authentication.

// Route: GET /restaurants/
// Fetches a list of all restaurants.
router.get('/', restaurantController.getAllRestaurants);

// Route: GET /restaurants/:id/items
// Fetches the menu items for a specific restaurant ID.
router.get('/:id/items', restaurantController.getRestaurantItems);

// Route: GET /restaurants/:id
// Fetches detailed information for a single restaurant.
router.get('/:id', restaurantController.getRestaurantById);

// WRITE (Admin) - These routes perform modifications and should be protected by authentication middleware
// (The authentication middleware is assumed to be mounted *before* this router or within the adminController functions).

// Route: POST /restaurants/
// Creates a new restaurant.
// Middleware: 'upload.single('image')' processes the file named 'image' and adds file info to req.file.
router.post('/', upload.single('image'), adminController.createRestaurant);

// Route: PUT /restaurants/:id
// Updates an existing restaurant (including potentially updating the image).
// Middleware: 'upload.single('image')' processes the new image if provided.
router.put('/:id', upload.single('image'), adminController.updateRestaurant);

// Route: DELETE /restaurants/:id
// Deletes a restaurant by ID. No file upload needed.
router.delete('/:id', adminController.deleteRestaurant);

module.exports = router;