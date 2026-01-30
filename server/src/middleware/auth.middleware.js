const jwt = require("jsonwebtoken");
// Fetch the secret key from environment variables or use a default fallback (⚠️ should be complex in production)
const jwtSecret = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * Express Middleware: Verifies the presence and validity of a JWT in the Authorization header.
 * If valid, it attaches the decoded user payload to req.user and calls next().
 * Endpoint: Used on all protected routes.
 */
exports.authenticateToken = (req, res, next) => {
  // 1. Check for the Authorization header (e.g., 'Authorization: Bearer <token>')
  const authHeader = req.headers["authorization"];
  // 401 Unauthorized: Header missing entirely
  if (!authHeader) return res.status(401).json({ error: "Token missing" });

  // 2. Extract the token (removes "Bearer " prefix)
  const token = authHeader.split(" ")[1];
  // 401 Unauthorized: Token content missing after "Bearer"
  if (!token) return res.status(401).json({ error: "Token missing" });

  // 3. Verify the token using the secret key
  jwt.verify(token, jwtSecret, (err, user) => {
    // 403 Forbidden: Token is invalid (expired, wrong secret, malformed)
    if (err) return res.status(403).json({ error: "Invalid token" });
    
    // Success: Attach the decoded payload (user info) to the request object
    req.user = user; 
    // Proceed to the next middleware or route handler
    next();
  });
};

/**
 * Express Middleware: Checks if the authenticated user (from req.user) has the 'admin' role.
 * This should always be placed *after* the authenticateToken middleware.
 * Endpoint: Used on routes that require administrator privileges.
 */
exports.isAdmin = (req, res, next) => {
  // Check the 'role' property attached by the authenticateToken middleware
  if (req.user.role !== "admin") {
    // 403 Forbidden: User is authenticated but lacks necessary permissions
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  // User is an admin, proceed to the route handler
  next();
};