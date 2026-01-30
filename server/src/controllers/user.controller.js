/**
 * Controller function to update an existing user's details (name and phone).
 * Assumes the user ID is provided in the request parameters (URL).
 * Endpoint: PUT/PATCH /users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    // 1. Get the target user ID from the URL path parameters
    const userId = req.params.id;
    
    // 2. Extract the fields to be updated from the request body
    const { name, phone } = req.body;
    
    // 3. Get the database connection object
    const db = req.app.locals.db;

    // 4. Execute the SQL UPDATE query
    // The query uses placeholders (?) for security (preventing SQL injection)
    // and updates the specified fields for the user matching the userId.
    await db.query(
      "UPDATE users SET name = ?, phone = ? WHERE user_id = ?",
      [name, phone, userId]
    );

    // 5. Respond with success confirmation (HTTP 200 OK)
    res.json({ message: "User updated successfully" });
  } catch (error) {
    // Error Handling: Log the error details and send a generic 500 server error response.
    console.error("Update error:", error);
    res.status(500).json({ error: "Update failed" });
  }
};