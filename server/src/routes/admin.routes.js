const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
// Middleware for authentication and token validation
const { authenticateToken } = require("../middleware/auth.middleware"); 
// Controller containing the business logic for CRUD operations
const adminController = require("../controllers/admin.controller"); 

// --- MULTER SETUP (Handles file uploads) ---
const multer = require('multer');
const uploadDir = 'uploads/';
// Ensures the directory for storing uploaded files exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Configure Multer's disk storage settings
const storage = multer.diskStorage({
  // Defines the destination folder for uploaded files
  destination: (req, file, cb) => cb(null, 'uploads/'),
  // Defines the unique filename structure: 'admin-' + timestamp + original extension
  filename: (req, file, cb) => cb(null, 'admin-' + Date.now() + path.extname(file.originalname))
});
// Create the Multer instance using the defined storage configuration
const upload = multer({ storage: storage });
// --------------------------------------------------

// ## Restaurant Management Routes

// Route Chain: 1. Authenticate user -> 2. Process 'image' file upload -> 3. Execute controller logic
router.post(
  "/create-restaurant", 
  authenticateToken, // Ensures only logged-in users can access
  upload.single('image'), // Multer middleware: handles file upload and adds 'req.file'
  adminController.createRestaurant
);

// Route Chain: 1. Authenticate user -> 2. Process 'image' file upload -> 3. Execute controller logic
router.put(
  "/restaurant/:id", 
  authenticateToken, 
  upload.single('image'), // Supports updating the restaurant image
  adminController.updateRestaurant
);

// Deletes a restaurant by ID. Note: No file upload middleware needed here.
router.delete(
  "/restaurant/:id", 
  authenticateToken, 
  adminController.deleteRestaurant
);

// --------------------------------------------------
// ## Menu Item Management Routes

// Route Chain: 1. Authenticate user -> 2. Process 'image' file upload -> 3. Execute controller logic
router.post(
  "/create-item", 
  authenticateToken, 
  upload.single('image'), // Handles item image upload
  adminController.createItem
);

// Route Chain: 1. Authenticate user -> 2. Process 'image' file upload -> 3. Execute controller logic
router.put(
  "/item/:id", 
  authenticateToken, 
  upload.single('image'), // Supports updating the item image
  adminController.updateItem
);

// Deletes a menu item by ID.
router.delete(
  "/item/:id", 
  authenticateToken, 
  adminController.deleteItem
);

module.exports = router;