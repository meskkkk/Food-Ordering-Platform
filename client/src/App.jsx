import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Context Providers
import { AuthProvider, AuthContext } from "./components/context/AuthContext";
import { CartProvider } from "./components/context/CartContext";

// Components & Styles
import './components/pages/Auth.css';
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/common/Navbar";

// Pages
import AuthPage from "./components/pages/AuthPage";
import Profile from "./components/pages/Profile";
import Home from "./components/pages/Home";
import RestaurantMenu from "./components/pages/RestaurantMenu";
import Cart from "./components/pages/Cart";
import CategoryPage from "./components/pages/CategoryPage";
import OrderSuccess from "./components/pages/OrderSuccess";
import OrderTracking from "./components/pages/OrderTracking";
import OrderHistory from "./components/pages/OrderHistory";
import Checkout from "./components/pages/Checkout";
import AdminDashboard from "./components/pages/AdminDashboard";

// Custom wrapper to ensure only admins can access specific routes
const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  // If user exists and is an admin, show content; otherwise redirect to login
  return user && user.role === "admin" ? children : <Navigate to="/login" />;
};

function App() {
  return (
    // Wrap app in Providers so Auth and Cart data is available globally
    <AuthProvider>
      <CartProvider>
        <Router>
          {/* Navbar shows on all pages */}
          <Navbar />

          <div className="container-fluid p-0">
            <Routes>
              {/* --- Public Routes (Accessible by anyone) --- */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/restaurant/:id" element={<RestaurantMenu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/register" element={<AuthPage />} />

              {/* --- Private Routes (Require user login) --- */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />

              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />

              <Route
                path="/order-success"
                element={
                  <PrivateRoute>
                    <OrderSuccess />
                  </PrivateRoute>
                }
              />

              <Route
                path="/order-tracking/:id"
                element={
                  <PrivateRoute>
                    <OrderTracking />
                  </PrivateRoute>
                }
              />

              <Route
                path="/order-history"
                element={
                  <PrivateRoute>
                    <OrderHistory />
                  </PrivateRoute>
                }
              />

              {/* --- Admin Routes (Require Admin role) --- */}
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;