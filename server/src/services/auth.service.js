const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Configuration: Defines the complexity (salt rounds) for bcrypt hashing and the secret key for JWT signing.
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * Handles user registration logic.
 * @param {object} db - Database connection object.
 * @param {string} email - User's email.
 * @param {string} password - User's plain-text password.
 * @param {string} name - User's name.
 * @param {string} phone - User's phone number.
 * @returns {object} { success: boolean, message?: string }
 */
exports.register = async (db, email, password, name, phone) => {
  try {
    // Check if user exists: Prevents duplicate accounts.
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0) {
      // 409 Conflict logic (handled by controller): User already exists.
      return { success: false, message: "User already exists" };
    }

    // Password Hashing: Securely hash the plain-text password before saving.
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user into the database.
    await db.query(
      "INSERT INTO users (name, email, password, role ,phone) VALUES (?, ?, ?, ?,?)",
      [name, email, hashedPassword, "customer", phone] // Default role is 'customer'
    );

    return { success: true };
  } catch (error) {
    console.error("Service registration error:", error);
    // Re-throw the error to be handled by the controller/global error handler.
    throw error;
  }
};

/**
 * Handles user login and session token generation.
 * @param {object} db - Database connection object.
 * @param {string} email - User's email.
 * @param {string} password - User's plain-text password.
 * @returns {object} { success: boolean, token?: string, message?: string }
 */
exports.login = async (db, email, password) => {
  try {
    // 1. Fetch user by email
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    // 401 Unauthorized logic: User not found.
    if (rows.length === 0)
      return { success: false, message: "Invalid credentials" };

    const user = rows[0];
    
    // 2. Password Comparison: Compares plain-text password to the stored hash.
    const validPassword = await bcrypt.compare(password, user.password);
    // 401 Unauthorized logic: Password does not match hash.
    if (!validPassword)
      return { success: false, message: "Invalid credentials" };

    // 3. JWT Generation: Creates a signed token containing essential user information.
    const token = jwt.sign(
      { 
        email: user.email, 
        user_id: user.user_id, 
        role: user.role, 
        phone: user.phone, 
        name: user.name 
      },
      jwtSecret,
      { expiresIn: "1h" } // Token expiry set to 1 hour for security.
    );
    // Success: Return the signed token to the client.
    return { success: true, token };
  } catch (error) {
    console.error("Service login error:", error);
    throw error;
  }
};