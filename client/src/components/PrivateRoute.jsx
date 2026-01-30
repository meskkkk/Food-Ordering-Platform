// src/components/PrivateRoute.jsx
import React from 'react';
import { useContext } from 'react';
// Navigate is a component from React Router used to redirect users programmatically
import { Navigate } from 'react-router-dom';
// Context import to access the global authentication state
import { AuthContext } from './context/AuthContext';

/**
 * PrivateRoute Component
 * A wrapper component that protects routes from unauthenticated users.
 * * Usage:
 * <PrivateRoute>
 * <Dashboard />
 * </PrivateRoute>
 */
const PrivateRoute = ({ children }) => {
  // Access current user and loading status from the AuthContext
  const { user, loading } = useContext(AuthContext);

  // --- 1. Loading State ---
  // If the auth check (e.g., verifying token with backend) is still in progress,
  // show a loading indicator instead of redirecting immediately.
  // This prevents "flashing" the login page while the app is just checking credentials.
  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // --- 2. Authentication Check ---
  // If loading is done and there is no user object, the user is not authenticated.
  // Redirect them to the login page.
  if (!user) {
    return <Navigate to="/login" />;
  }

  // --- 3. Render Protected Content ---
  // If the user exists, render the child components (the protected page).
  return children;
};

export default PrivateRoute;