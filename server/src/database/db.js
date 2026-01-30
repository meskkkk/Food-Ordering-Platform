const mysql = require("mysql2/promise");

async function initializeDatabase() {
  let tempConnection;
  const SCHEMA_SQL = `
      -- 1. users table
      CREATE TABLE IF NOT EXISTS users (
          user_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          role ENUM('customer', 'admin') DEFAULT 'customer'
      );

      -- 2. restaurants table
      CREATE TABLE IF NOT EXISTS restaurants (
          restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          image VARCHAR(255),
          phone VARCHAR(20),
          delivery_time INT,
          preparing_time INT,
          category VARCHAR(100),
          closing_time TIME,
          opening_time TIME,
          status ENUM('open', 'closed', 'busy') DEFAULT 'open'
      );

      -- 3. customer_location table
      CREATE TABLE IF NOT EXISTS customer_location (
          location_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          street VARCHAR(255) NOT NULL,
          building VARCHAR(100),
          apartment VARCHAR(100),
          city VARCHAR(100),
          floor VARCHAR(50),
          FOREIGN KEY (user_id) REFERENCES users(user_id)
      );

      -- 4. items table (Menu Items)
      CREATE TABLE IF NOT EXISTS items (
          item_id INT AUTO_INCREMENT PRIMARY KEY,
          restaurant_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image VARCHAR(255),
          category VARCHAR(100),
          availability BOOLEAN DEFAULT TRUE,
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
      );

      -- 5. orders table
      CREATE TABLE IF NOT EXISTS orders (
          order_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          location_id INT NOT NULL,
          order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          status ENUM('Preparing', 'On the way', 'Delivered', 'Cancelled') DEFAULT 'Preparing',
          total_amount DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(50),
          FOREIGN KEY (user_id) REFERENCES users(user_id),
          FOREIGN KEY (location_id) REFERENCES customer_location(location_id)
      );

      -- 6. order_details table
      CREATE TABLE IF NOT EXISTS order_details (
          order_id INT NOT NULL,
          item_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          PRIMARY KEY (order_id, item_id),
          FOREIGN KEY (order_id) REFERENCES orders(order_id),
          FOREIGN KEY (item_id) REFERENCES items(item_id)
      );

      -- 7. reviews table
      CREATE TABLE IF NOT EXISTS reviews (
          review_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          restaurant_id INT NOT NULL,
          order_id INT,  -- <--- THIS LINE WAS MISSING. I ADDED IT HERE.
          rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT,
          review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(order_id),
          FOREIGN KEY (user_id) REFERENCES users(user_id),
          FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
      );
      `;

  try {
    tempConnection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "root",
    });

    await tempConnection.execute("CREATE DATABASE IF NOT EXISTS Food_Service");
    await tempConnection.end();

    const pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "Food_Service",
      multipleStatements: true,
    });
    
    await pool.query(SCHEMA_SQL);

    // --- MIGRATIONS (Safe to keep for future updates) ---
    
    try {
      await pool.query("ALTER TABLE restaurants ADD COLUMN delivery_time INT");
    } catch (err) {
      if (!err.message.includes("Duplicate column")) throw err;
    }
    
    try {
        await pool.query("ALTER TABLE restaurants ADD COLUMN category VARCHAR(100)");
      } catch (err) {
        if (!err.message.includes("Duplicate column")) throw err;
      }

    try {
      await pool.query("ALTER TABLE reviews ADD COLUMN order_id INT NULL");
    } catch (err) {
      const msg = (err && err.message) || "";
      if (!msg.includes("Duplicate column") && !msg.includes("already exists")) throw err;
    }

    try {
      await pool.query("CREATE INDEX idx_reviews_order_id ON reviews(order_id)");
    } catch (err) {
      const msg = (err && err.message) || "";
      if (!msg.includes("Duplicate key name") && !msg.includes("already exists")) throw err;
    }

    // --- STATUS MIGRATION ---
    try {
      const preparingTime = 15; 
      const deliveryTime = 20; 

      const preparingThreshold = new Date(Date.now() - preparingTime * 60 * 1000);
      await pool.query(
        `UPDATE orders SET status = 'On the way' WHERE status = 'Preparing' AND order_date <= ?`,
        [preparingThreshold]
      );

      const deliveryThreshold = new Date(Date.now() - (preparingTime + deliveryTime) * 60 * 1000);
      await pool.query(
        `UPDATE orders SET status = 'Delivered' WHERE status = 'On the way' AND order_date <= ?`,
        [deliveryThreshold]
      );
    } catch (err) {
      console.error("Migration log:", err.message);
    }
    return pool;
  } catch (error) {
    throw error;
  }
}

module.exports = initializeDatabase;