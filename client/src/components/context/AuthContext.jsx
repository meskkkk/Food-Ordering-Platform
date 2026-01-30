import React, { createContext, useState, useEffect } from "react";
import api from "../services/api";

// 1. Create the Context
// This is the "global container" that holds authentication data.
// Any component in the app can access this via useContext(AuthContext).
export const AuthContext = createContext();

// 2. The Provider Component
// This component wraps the entire application (in App.js) to provide auth state to all children.
export const AuthProvider = ({ children }) => {
  // State to hold the current logged-in user's data (e.g., id, name, email, role)
  const [user, setUser] = useState(null);
  
  // State to track if we are currently checking if a user is logged in.
  // We start as 'true' so the app doesn't flash the Login screen while we are checking localStorage.
  const [loading, setLoading] = useState(true);

  // 3. Effect: Check Session on App Load
  // This runs ONLY once when the app starts (or refreshes).
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      // Check if a JWT token exists in the browser's storage
      const token = localStorage.getItem("token");
      
      if (token) {
        try {
          // VALIDATION: Don't just trust the local token. Send it to the backend to verify it's valid.
          // This ensures that if a user was banned or the token expired, they are logged out.
          const response = await api.get("/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });

          // If valid, update the global state with fresh user data from the database
          if (response.data && response.data.user) {
            setUser(response.data.user); 
          } else {
            setUser(null);
          }
        } catch (err) {
          // If the token is invalid/expired, clean up storage
          console.error("Invalid token or failed to fetch profile", err);
          localStorage.removeItem("token");
          setUser(null);
        }
      }
      
      // Finished checking (whether success or fail), so we can stop loading
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  // 4. Login Function
  // Accepts credentials, calls API, saves token, and updates global state.
  const login = async (email, password) => {
    try {
      // Step A: Call the backend login endpoint
      const response = await api.post("/api/auth/login", { email, password });

      // Step B: Destructure response. Usually contains the JWT string and User object.
      const { token, user: userData } = response.data;

      // Step C: Save token to localStorage so login persists on refresh
      localStorage.setItem("token", token);

      // Step D: Determine user data
      // We prefer the 'userData' sent explicitly by the backend.
      // If that's missing, we decode the JWT token as a fallback to get basic info.
      let finalUser = userData;
      if (!finalUser) {
        const decoded = JSON.parse(atob(token.split(".")[1])); // Decodes Base64 JWT payload
        finalUser = { token, ...decoded };
      }

      // Step E: Update global state
      setUser(finalUser);

      // CRITICAL: Return success object so the UI (Login page) knows to redirect the user
      return { success: true, user: finalUser };
      
    } catch (error) {
      console.error("Login failed:", error);
      // Extract error message safely from the response
      const errorMsg = error.response?.data?.message || "Login failed.";
      return { success: false, message: errorMsg };
    }
  };
  
  // 5. Register Function
  // Creates a new account and automatically logs the user in.
  const register = async (userData) => {
    try {
      const response = await api.post("/api/auth/register", userData);
      const { token } = response.data;

      // If registration returns a token, log them in immediately
      if (token) {
        localStorage.setItem("token", token);
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUser({ token, ...decoded });
      }
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Registration failed.";
      return { success: false, message: errorMsg };
    }
  };

  // 6. Logout Function
  // Clears storage and state to sign the user out.
  const logout = () => {
    localStorage.removeItem("token"); // Destroy the token
    setUser(null); // Clear global state
    window.location.href = "/login"; // Force redirect to login page
  };

  return (
    // Expose the state and functions to the rest of the app
    <AuthContext.Provider
      value={{ user, login, register, logout, loading, setUser }}
    >
      {/* Render Block: 
         We only render 'children' (the App) AFTER loading is finished.
         This prevents the "Login" page from flickering briefly if the user 
         is actually already authenticated via localStorage.
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
};