/**
 * Creates a new restaurant entry in the database.
 * Handles dual inputs for images (file upload vs URL string).
 */
async function createRestaurant(req, res) {
  // Logic: Prioritize an uploaded file (via Multer middleware). 
  // If no file is uploaded, fallback to a raw string URL provided in the body.
  const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;
  
  const { name, phone, status, closing_time, opening_time, category, delivery_time } = req.body;
  // Retrieve the shared database connection from Express app locals
  const db = req.app.locals.db;

  if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
  }

  try {
      const query = `
          INSERT INTO restaurants (name, phone, image, status, closing_time, opening_time, category, delivery_time) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Execute insert with default fallbacks:
      // - Status defaults to 'open'
      // - Times default to null if not specified
      // - Delivery time defaults to 0 if missing
      const [result] = await db.query(query, [
          name, 
          phone, 
          imagePath || '', 
          status || 'open',
          closing_time || null,
          opening_time || null,
          category || '',
          delivery_time || 0
      ]); 
      
      // Return HTTP 201 (Created) and the ID of the new row for frontend redirection
      res.status(201).json({ 
          message: 'Restaurant created successfully', 
          restaurantId: result.insertId 
      });

  } catch (error) {
      console.error('Error creating restaurant:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Updates an existing restaurant's details.
 * Performs a full update of the specified columns.
 */
async function updateRestaurant(req, res) {
  try {
    const restaurantId = req.params.id;
    // Handle image update: If a new file is sent, use it; otherwise, keep the old string/URL passed in body
    const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    
    const { name, phone, status, opening_time, closing_time, category, delivery_time } = req.body;
    const db = req.app.locals.db;

    const query = `
      UPDATE restaurants 
      SET name = ?, phone = ?, image = ?, status = ?, opening_time = ?, closing_time = ?, category = ?, delivery_time = ? 
      WHERE restaurant_id = ?
    `;
    await db.query(query, [
      name,
      phone,
      imagePath,
      status,
      opening_time,
      closing_time,
      category,
      delivery_time,
      restaurantId
    ]);

    res.json({ message: "Restaurant updated successfully" });
  } catch (err) {
    console.error("Update restaurant error:", err);
    res.status(500).json({ error: "Failed to update restaurant" });
  }
}

async function deleteRestaurant(req, res) {
  try {
    const restaurantId = req.params.id;
    const db = req.app.locals.db;

    // Hard delete: Removes the row physically from the database
    await db.query("DELETE FROM restaurants WHERE restaurant_id = ?", [restaurantId]);

    res.json({ message: "Restaurant deleted successfully" });
  } catch (err) {
    console.error("Delete restaurant error:", err);
    res.status(500).json({ error: "Failed to delete restaurant" });
  }
}

// --- MENU ITEM FUNCTIONS (Updated for Images & Availability) ---

/**
 * Adds a new menu item to a specific restaurant.
 * Includes logic to normalize boolean inputs from form-data.
 */
async function createItem(req, res) {
  const db = req.app.locals.db;
  
  // 1. Handle Image: Use uploaded file path OR provided string
  const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;
  
  const { restaurant_id, name, description, price, category, availability } = req.body;

  // Validate Foreign Key (restaurant_id) and core business fields
  if (!restaurant_id || !name || !price) {
      return res.status(400).json({ error: "Restaurant ID, Name, and Price are required." });
  }

  try {
      // 2. Handle Availability: Normalization Logic
      // Form-data often sends booleans as strings ("true", "1"). 
      // This ensures we save a clean integer (1 or 0) for the database TINYINT/BOOLEAN column.
      const avail = (availability === 'true' || availability === '1' || availability === 1) ? 1 : 0;

      const query = `
          INSERT INTO items (restaurant_id, name, description, price, image, category, availability) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
          restaurant_id, 
          name, 
          description || "", 
          price, 
          imagePath || "", 
          category || "", 
          avail
      ]);

      res.status(201).json({ message: "Item created successfully", itemId: result.insertId });

  } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Updates a menu item.
 * Re-applies image path logic and availability normalization.
 */
async function updateItem(req, res) {
  try {
    const db = req.app.locals.db;
    const itemId = req.params.id;
    
    // 1. Handle Image
    const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.image;
    
    const { name, description, price, restaurant_id, category, availability } = req.body;
    
    // 2. Handle Availability
    // Converts input to strictly 1 or 0 to prevent SQL type errors or falsy behavior
    const avail = (availability === 'true' || availability === '1' || availability === 1) ? 1 : 0;

    const query = `
        UPDATE items 
        SET name=?, description=?, price=?, image=?, restaurant_id=?, category=?, availability=? 
        WHERE item_id=?
    `;
    
    await db.query(query, [name, description, price, imagePath, restaurant_id, category, avail, itemId]);
    
    res.json({ message: "Item updated successfully" });
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
}

async function deleteItem(req, res) {
  try {
    const itemId = req.params.id;
    const db = req.app.locals.db;
    await db.query("DELETE FROM items WHERE item_id = ?", [itemId]);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
}

module.exports = {
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  createItem,
  updateItem,
  deleteItem
};