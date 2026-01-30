/**
 * Retrieves daily sales statistics.
 * Supports optional filtering by a specific date via query parameter (e.g., ?date=2025-12-08).
 * If no date is provided, it returns the full history grouped by day.
 */
async function getDailySales(req, res) {
    const db = req.app.locals.db;
    const { date } = req.query; // Get date from frontend (optional)

    try {
        // Base Query: Aggregates total sales and order count per day
        // DATE(order_date) strips the time component to group all orders on the same calendar day
        let query = `
            SELECT 
                DATE(order_date) AS day, 
                SUM(total_amount) AS total_sales, 
                COUNT(order_id) AS orders_count
            FROM orders
        `;
        
        const params = [];

        // Dynamic Query Construction:
        // If a specific date is requested, append a WHERE clause.
        // We use '?' placeholders and a params array to prevent SQL Injection.
        if (date) {
            query += ` WHERE DATE(order_date) = ?`;
            params.push(date);
        }

        // Finalize query with grouping and sorting (newest days first)
        query += ` GROUP BY DATE(order_date) ORDER BY day DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error in getDailySales:", err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * Retrieves monthly sales statistics.
 * Supports optional filtering by a specific month (e.g., ?month=2025-12).
 */
async function getMonthlySales(req, res) {
    const db = req.app.locals.db;
    const { month } = req.query; // Get month from frontend (optional)

    try {
        // Base Query: Aggregates data by Month
        // DATE_FORMAT(..., '%Y-%m') converts timestamps into 'YYYY-MM' strings for grouping
        let query = `
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m') AS month, 
                SUM(total_amount) AS total_sales, 
                COUNT(order_id) AS orders_count
            FROM orders
        `;

        const params = [];

        // Dynamic filtering for a specific month
        if (month) {
            query += ` WHERE DATE_FORMAT(order_date, '%Y-%m') = ?`;
            params.push(month);
        }

        query += ` GROUP BY month ORDER BY month DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error("Error in getMonthlySales:", err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getDailySales, getMonthlySales };