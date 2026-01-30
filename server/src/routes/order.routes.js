const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticateToken } = require("../middleware/auth.middleware");

// --- ADMIN ROUTES ---


// Fetches ALL orders for the Admin Dashboard Sales Panel
router.get('/', orderController.getAllOrders); 


// Updates order status (e.g., 'Preparing' -> 'Delivered')
router.put('/:id', authenticateToken, orderController.updateOrderStatus);


// --- CUSTOMER ROUTES ---
// Fetches past orders for the logged-in user (Profile Page)
router.get('/history', authenticateToken, orderController.getOrderHistory);



// Note: 'authenticateToken' ensures we know WHICH user is ordering
router.post('/', authenticateToken, orderController.createOrder);

// --- NEW ROUTE ADDED ---

// Gets specific order details for order tracking page
router.get('/:id', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const orderId = req.params.id;
  
  // Get user ID from token (set by authenticateToken middleware)
  const userId = req.user.userId || req.user.id || req.user.user_id;

  try {
    // Get order with address details
    const [orders] = await db.query(
      `SELECT o.*, cl.street, cl.building, cl.apartment, cl.city, cl.floor 
       FROM orders o
       LEFT JOIN customer_location cl ON o.location_id = cl.location_id
       WHERE o.order_id = ? AND o.user_id = ?`,
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orders[0];

    // Get order items with restaurant info
    const [items] = await db.query(
      `SELECT od.quantity, i.name, i.price, i.item_id, i.image, 
              r.restaurant_id, r.name as restaurant_name
       FROM order_details od
       LEFT JOIN items i ON od.item_id = i.item_id
       LEFT JOIN restaurants r ON i.restaurant_id = r.restaurant_id
       WHERE od.order_id = ?`,
      [orderId]
    );

    // Format the response
    const response = {
      order_id: order.order_id,
      user_id: order.user_id,
      status: order.status,
      total_amount: order.total_amount,
      payment_method: order.payment_method,
      order_date: order.order_date,
      created_at: order.order_date, // Alias for frontend compatibility
      restaurant_id: items[0]?.restaurant_id || null,
      restaurant_name: items[0]?.restaurant_name || "Restaurant",
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      address: {
        street: order.street,
        building: order.building,
        apartment: order.apartment,
        city: order.city,
        floor: order.floor
      }
    };

    res.json(response);

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

module.exports = router;