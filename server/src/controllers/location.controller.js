/**
 * Controller function to add a new delivery location for the authenticated user.
 * Assumes 'req.user.user_id' is populated by prior authentication middleware (e.g., JWT verification).
 */
async function addLocation(req, res) {
  // Retrieve the shared database connection from Express app locals
  const db = req.app.locals.db;

  try {
      // Extract the authenticated user's ID from the request object
      const userId = req.user.user_id; 

      // Destructure and extract location details from the request body
      const { 
          street, 
          building, 
          apartment, 
          city, 
          floor 
      } = req.body;

      // Input Validation: Ensure essential fields for mapping/delivery are present
      if (!street || !city) {
          return res.status(400).json({ error: "Street and city are required fields." });
      }

      // Execute SQL INSERT query to save the new location
      // Null coalescing (|| null) ensures that optional fields (building, apartment, floor) 
      // are stored as NULL in the database if they are not provided in the request body.
      const [result] = await db.query(
          `INSERT INTO customer_location 
          (user_id, street, building, apartment, city, floor) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, street, building || null, apartment || null, city, floor || null]
      );

      // Return HTTP 201 (Created) status upon successful insertion,
      // including the newly created location ID.
      res.status(201).json({
          message: "Location added successfully.",
          locationId: result.insertId,
          userId: userId
      });

  } catch (error) {
      console.error('Error adding location:', error);
      // Return 500 Internal Server Error if the database query fails
      res.status(500).json({ error: error.message || 'Failed to add location.' });
  }
}

/**
 * Retrieves all stored delivery locations associated with the authenticated user.
 * Assumes 'req.user.user_id' is populated by prior authentication middleware.
 */
async function getLocations(req, res) {
    const db = req.app.locals.db;
  
    try {
      // Extract the authenticated user's ID
      const userId = req.user.user_id;
  
      // Execute SQL SELECT query to fetch all locations matching the user_id
      const [rows] = await db.query(
        `SELECT * FROM customer_location WHERE user_id = ?`,
        [userId]
      );
  
      // Return the array of location objects with HTTP 200 OK status
      res.status(200).json(rows);
  
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: 'Failed to fetch locations.' });
    }
}
  
module.exports = { 
    addLocation, 
    getLocations 
};