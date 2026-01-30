const authService = require("../services/auth.service");

/**
 * Handles user registration.
 * Validates input, determines username logic, and delegates creation to authService.
 */
exports.registerUser = async (req, res) => {
  try {
    const { email, password, name ,phone} = req.body;
    
    // Basic Input Validation: Ensure critical credentials exist
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Username Logic: Use provided name or default to email prefix (e.g., john@example.com -> john)
    const userName = name || email.split("@")[0];

    // Retrieve database connection and call service layer
    const db = req.app.locals.db;
    const result = await authService.register(db, email, password, userName,phone);
    
    // Handle specific service errors (e.g., duplicate email) with 409 Conflict
    if (!result.success) return res.status(409).json({ error: result.message });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

/**
 * Handles user login.
 * Verifies credentials via service and returns a JWT token if successful.
 */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const db = req.app.locals.db;
    // Delegate password verification and token generation to the service
    const result = await authService.login(db, email, password);
    
    // Return 401 Unauthorized if credentials don't match or user doesn't exist
    if (!result.success) return res.status(401).json({ error: result.message });

    // Return the JWT token to the client for future authenticated requests
    res.json({ token: result.token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Retrieves the currently logged-in user's profile.
 * Relies on middleware (likely JWT verification) to populate req.user.
 */
exports.getProfile = async (req, res) => {
  try {
    const db = req.app.locals.db;
    // 'req.user' is typically attached by an authentication middleware before this controller runs
    const userId = req.user.user_id; // from token

    // Explicitly select only safe fields to return (never return the password hash)
    const [rows] = await db.query(
      "SELECT user_id, name, phone, email, role FROM users WHERE user_id = ?",
      [userId]
    );

    if (!rows.length)
      return res.status(404).json({ error: "User not found" });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};