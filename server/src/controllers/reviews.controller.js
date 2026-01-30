/**
 * Retrieves the average rating and review count for all menu items.
 * Endpoint: GET /ratings/items
 */
async function getItemRatings(req, res) {
  const db = req.app.locals.db;
  try {
    // Aggregation Query: Calculates the average rating and total count of reviews 
    // for every unique item_id present in the 'reviews' table.
    const [rows] = await db.query(`
            SELECT item_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
            FROM reviews
            GROUP BY item_id
            ORDER BY avg_rating DESC
        `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ---

/**
 * Handles the submission of a new restaurant review by an authenticated user.
 * Performs validation checks for authentication and optional order ownership.
 * Endpoint: POST /restaurants/:id/review
 */
async function submitReview(req, res) {
  const db = req.app.locals.db;
  try {
    const restaurantId = req.params.id;
    // Authentication Check: Safely extract user ID from various possible token payloads
    const userId = req.user.userId || req.user.id || req.user.user_id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { order_id, item_ratings, comment } = req.body;

    // Compute average rating from item_ratings if provided
    let avgRating = null;
    if (item_ratings && typeof item_ratings === "object") {
      // 1. Get rating values, convert to integer, default to 0 if invalid.
      const vals = Object.values(item_ratings)
        .map((v) => parseInt(v) || 0)
        // 2. Filter out non-positive (invalid) ratings.
        .filter((v) => v > 0);
      
      if (vals.length > 0) {
        // 3. Calculate and round the average of the valid ratings.
        avgRating = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      }
    }

    // Validation: Require at least one valid rating to proceed
    if (!avgRating) {
      return res.status(400).json({ error: "No valid ratings provided" });
    }

    // Optional Validation: If order_id was provided, validate ownership (best-effort).
    if (order_id) {
      try {
        // Check if the order exists and belongs to the current authenticated user
        const [orderRows] = await db.query(
          "SELECT user_id FROM orders WHERE order_id = ?",
          [order_id]
        );
        if (!orderRows || orderRows.length === 0) {
          return res.status(400).json({ error: "Invalid order_id" });
        }
        const orderOwner = orderRows[0].user_id;
        // Business Rule: Ensure the review submitter is the person who placed the order (Authorization check)
        if (orderOwner !== userId) {
          return res
            .status(403)
            .json({ error: "Order does not belong to the authenticated user" });
        }
      } catch (err) {
        console.error("Error validating order_id:", err);
        return res.status(500).json({ error: "Failed to validate order_id" });
      }
    }

    // Insert the primary review record into the 'reviews' table
    await db.query(
      `INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)`,
      [userId, restaurantId, order_id || null, avgRating, comment || null] // order_id and comment are optional (NULL if not provided)
    );

    res.json({ message: "Review submitted", rating: avgRating });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ error: "Failed to submit review" });
  }
}

module.exports = { getItemRatings, submitReview };