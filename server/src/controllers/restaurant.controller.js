/**
 * Retrieves a list of all restaurants from the database.
 * Endpoint: GET /restaurants
 */
async function getAllRestaurants(req, res) {
    // Access the database connection object stored in the application's local variables.
    const db = req.app.locals.db;
    try {
        // Execute a simple query to fetch all columns for all restaurants.
        const [rows] = await db.query('SELECT * FROM restaurants');
        
        // Respond with the list of restaurants as a JSON array (HTTP 200 OK).
        res.json(rows);
    } catch (error) {
        // Log and handle server/database errors, returning a 500 status.
        res.status(500).json({ error: error.message });
    }
}

// ---

/**
 * Retrieves all menu items belonging to a specific restaurant ID.
 * Endpoint: GET /restaurants/:id/items
 */
async function getRestaurantItems(req, res) {
    try {
        // Extract the unique identifier for the restaurant from the URL parameters.
        const restaurantId = req.params.id;
        const db = req.app.locals.db;

        // Query the 'items' table, filtering by the required restaurant_id.
        const [items] = await db.query(
            "SELECT * FROM items WHERE restaurant_id = ?",
            [restaurantId]
        );

        // Respond with the array of items for that restaurant.
        res.json(items);
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).json({ error: "Failed to fetch items" });
    }
};

// ---

/**
 * Retrieves a single restaurant record by its ID.
 * Endpoint: GET /restaurants/:id
 */
async function getRestaurantById(req, res){
    try {
        // Extract the restaurant ID from the URL parameters.
        const id = req.params.id;

        // Note: Using 'execute' here often implies prepared statements with mysql2, 
        // which is generally safer and slightly faster than 'query' for single fetches.
        // We select only necessary public fields (excluding potentially sensitive internal fields).
        const [rows] = await req.app.locals.db.execute(
            "SELECT restaurant_id, name, image FROM restaurants WHERE restaurant_id = ?",
            [id]
        );

        // Check if the query returned any results. If not, the resource wasn't found (404).
        if (rows.length === 0) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        // Return the single restaurant object (the first element in the results array).
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching restaurant:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ---

module.exports = { 
    getAllRestaurants, 
    getRestaurantItems, 
    getRestaurantById
};