// src/controllers/order.controller.js

// 1. GET ALL ORDERS (For Admin Panel)
/**
 * Retrieves all orders from the database, enriched with customer details and nested items.
 * Designed for administrative overview.
 */
async function getAllOrders(req, res) {
  const db = req.app.locals.db;
  try {
    // Step 1: Fetch Orders with Customer Name (Join Users table)
    // We select o.* to get all order fields, and u.name to fill the 'customerName' field
    const [orders] = await db.query(`
        SELECT o.*, u.name AS customerName
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.user_id
        ORDER BY o.order_date DESC
    `);

    // Step 2: Fetch Items for each order (to populate the 'items' array)
    // This uses Promise.all to concurrently fetch items for all orders, improving performance.
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query(
          `SELECT od.quantity, i.name, i.price 
              FROM order_details od
              LEFT JOIN items i ON od.item_id = i.item_id
              WHERE od.order_id = ?`,
          [order.order_id]
        );
        // Map the array of items onto the corresponding order object
        return { ...order, items };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
}

// 2. GET ORDER HISTORY (For Customer Profile)
/**
 * Retrieves the order history for the authenticated customer, including items and restaurant details.
 */
async function getOrderHistory(req, res) {
  try {
    // Authentication Safety Check: Try multiple common property names from JWT middleware payload
    const userId = req.user.userId || req.user.id || req.user.user_id;
    if (!userId) {
      console.warn(
        "getOrderHistory: user id not present on token payload",
        req.user
      );
      return res.status(401).json({ error: "User not authenticated" });
    }
    const db = req.app.locals.db;

    // Fetch the customer's top-level orders, sorted by date (most recent first)
    const [orders] = await db.query(
      `SELECT o.* FROM orders o WHERE o.user_id = ? ORDER BY o.order_date DESC`,
      [userId]
    );

    // For each order, fetch its items and restaurant info
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // Nested query: Joins order_details -> items -> restaurants to retrieve full item context
        const [items] = await db.query(
          `SELECT od.quantity, i.name, i.price, i.item_id, i.image, r.restaurant_id, r.name as restaurant_name
          FROM order_details od
          LEFT JOIN items i ON od.item_id = i.item_id
          LEFT JOIN restaurants r ON i.restaurant_id = r.restaurant_id
          WHERE od.order_id = ?`,
          [order.order_id]
        );

        // Collect unique restaurants for this order
        // This logic is crucial for multi-restaurant orders, aggregating unique restaurant info
        const restaurants = [];
        const seen = new Set();
        for (const it of items) {
          if (it.restaurant_id && !seen.has(it.restaurant_id)) {
            seen.add(it.restaurant_id);
            restaurants.push({
              id: it.restaurant_id,
              name: it.restaurant_name,
            });
          }
        }

        return {
          ...order,
          // Map to simplify item structure (removes redundant fields from the item result set)
          items: items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            restaurant_id: i.restaurant_id,
            restaurant_name: i.restaurant_name,
          })),
          restaurants,
        };
      })
    );

    res.json(ordersWithItems);
  } catch (error) {
    console.error("Order history error:", error);
    res.status(500).json({ error: "Error retrieving order history" });
  }
}

// 3. CREATE A NEW ORDER
/**
 * Handles the creation of a new order and inserts corresponding details into the database.
 */
async function createOrder(req, res) {
  const db = req.app.locals.db;

  try {
    const { user_id, items, locationId, total_amount, payment_method } =
      req.body;

    // Validation: Ensure the order isn't empty
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items in order" });
    }

    // Determine User ID: Prioritize body ID (for testing) then fall back to authenticated token payload
    const finalUserId = user_id || (req.user ? req.user.userId : null);

    if (!finalUserId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Create main order entry
    // The initial status is set to 'Preparing'.
    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, location_id, total_amount, payment_method, status)
          VALUES (?, ?, ?, ?, 'Preparing')`,
      [finalUserId, locationId, total_amount, payment_method || "Cash"]
    );

    const orderId = orderResult.insertId;

    // Insert items into order_details (one row per item/quantity)
    for (let item of items) {
      const itemId = item.itemId || item.id; // Allow flexible item ID keys
      try {
        await db.query(
          `INSERT INTO order_details (order_id, item_id, quantity, price)
              VALUES (?, ?, ?, ?)`,
          [orderId, itemId, item.quantity, item.price || 0]
        );
      } catch (detailErr) {
        // Log a warning if one item insertion fails, but attempt to continue
        console.warn("Skipping order_details insertion:", detailErr.message);
      }
    }

    // Return 201 Created status
    res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (error) {
    console.error("ORDER ERROR:", error);
    res.status(500).json({ error: "Failed to place order" });
  }
}

// 4. UPDATE ORDER STATUS (For Admin)
/**
 * Allows an administrator to manually update the status of a specific order.
 */
async function updateOrderStatus(req, res) {
  const db = req.app.locals.db;
  const { id } = req.params; // Order ID from URL parameter
  const { status } = req.body; // New status from request body

  try {
    await db.query("UPDATE orders SET status = ? WHERE order_id = ?", [
      status,
      id,
    ]);
    res.json({ message: "Order status updated" });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
}

// 5. AUTO-UPDATE ORDER STATUSES (Server-side progression)
/**
 * Service function, intended to be called by a cron job or background process,
 * to automatically advance orders through their lifecycle based on elapsed time since creation.
 */
async function autoUpdateOrderStatuses(db) {
  try {
    const now = new Date();
    // Define the business rules for status transitions in minutes
    const preparingTime = 15; // Minutes until "On the way"
    const deliveryTime = 20; // Additional minutes until "Delivered"

    // Update "Preparing" orders to "On the way" after preparingTime minutes
    // Constructs a timestamp that occurred N minutes ago (the threshold)
    const preparingThreshold = new Date(now - preparingTime * 60 * 1000);
    await db.query(
      `UPDATE orders 
        SET status = 'On the way' 
        WHERE status = 'Preparing' 
        AND order_date <= ?`,
      [preparingThreshold]
    );

    // Update "On the way" orders to "Delivered" after total elapsed time
    // Calculates total time since order creation (Preparing + Delivery time)
    const deliveryThreshold = new Date(
      now - (preparingTime + deliveryTime) * 60 * 1000
    );
    await db.query(
      `UPDATE orders 
        SET status = 'Delivered' 
        WHERE status = 'On the way' 
        AND order_date <= ?`,
      [deliveryThreshold]
    );
  } catch (error) {
    console.error("Error auto-updating order statuses:", error);
  }
}

module.exports = {
  getAllOrders,
  getOrderHistory,
  createOrder,
  updateOrderStatus,
  autoUpdateOrderStatuses,
};