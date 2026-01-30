#!/usr/bin/env node
/**
 * Manual migration script to update all old orders to correct statuses
 * Run this once to fix all existing orders in the database
 * Usage: node scripts/migrateOrderStatuses.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

async function migrateOrderStatuses() {
  let pool;
  try {
    pool = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "root",
      database: "Food_Service",
    });

    console.log("🔄 Starting order status migration...\n");

    // Get all orders with their ages
    const [orders] = await pool.query(`
      SELECT order_id, status, order_date, 
             TIMESTAMPDIFF(MINUTE, order_date, NOW()) as ageMinutes
      FROM orders
      ORDER BY order_date DESC
    `);

    console.log(`📦 Found ${orders.length} total orders\n`);

    const preparingTime = 15; // minutes
    const deliveryTime = 20; // additional minutes

    let prepCount = 0;
    let delCount = 0;

    for (const order of orders) {
      const { order_id, status, ageMinutes } = order;

      console.log(
        `Order #${order_id}: status='${status}', age=${ageMinutes}min`
      );

      if (status === "Preparing" && ageMinutes >= preparingTime) {
        await pool.query("UPDATE orders SET status = ? WHERE order_id = ?", [
          "On the way",
          order_id,
        ]);
        prepCount++;
        console.log(
          `✅ Order #${order_id}: Preparing → On the way (${ageMinutes} min old)`
        );
      } else if (
        status === "On the way" &&
        ageMinutes >= preparingTime + deliveryTime
      ) {
        await pool.query("UPDATE orders SET status = ? WHERE order_id = ?", [
          "Delivered",
          order_id,
        ]);
        delCount++;
        console.log(
          `✅ Order #${order_id}: On the way → Delivered (${ageMinutes} min old)`
        );
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   • Orders updated to 'On the way': ${prepCount}`);
    console.log(`   • Orders updated to 'Delivered': ${delCount}`);
    console.log(`   • Total updated: ${prepCount + delCount}\n`);

    await pool.end();
    console.log("✅ Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (pool) await pool.end();
    process.exit(1);
  }
}

migrateOrderStatuses();
