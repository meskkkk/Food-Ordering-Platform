import React, { useEffect, useState } from "react";
// Hooks for accessing router state and navigation
import { useLocation, useNavigate, Link } from "react-router-dom";
// API service for fetching additional restaurant details
import api from "../services/api"; // Added API import

// --- INLINE ICONS (Replaces react-icons to prevent crashes in preview) ---
// These custom SVG components accept standard props (size, className, style)
// to mimic the behavior of the react-icons library without external dependencies.

// Icon: Checkmark inside a circle (Success state)
const FaCheckCircle = ({ size = "1em", className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    style={style}
    viewBox="0 0 16 16"
  >
    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
  </svg>
);

// Icon: Motorcycle (Delivery/Tracking)
const FaMotorcycle = ({ size = "1em", className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    style={style}
    viewBox="0 0 640 512"
  >
    <path d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H112C85.5 0 64 21.5 64 48v48H8c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h272c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H40c-22.1 0-40 17.9-40 40v96c0 22.1 17.9 40 40 40h13.3c.2-5.2 .6-10.2 1.5-15.1C66.7 274.1 106.9 240 152 240c49.3 0 92.5 40.7 96.8 91.2 .2 1.9 .2 3.7 .2 5.2 0 1.2-.1 2.3-.1 3.5h155.6c-.6-3.8-1.5-7.5-2.6-11.1-10.6-35.3-43.2-60.8-82-60.8-49.3 0-92.5 40.7-96.8 91.2-.2 1.9-.2 3.7-.2 5.2H64c-35.3 0-64 28.7-64 64v32c0 22.1 17.9 40 40 40h21.5c11.3 25.9 37.2 44 67.5 44s56.2-18.1 67.5-44h151c11.3 25.9 37.2 44 67.5 44s56.2-18.1 67.5-44H624c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm-500 64c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm202.7-80c10.6-35.3 43.2-60.8 82-60.8 38.8 0 71.4 25.5 82 60.8H326.7zM416 384c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm80-192H460.1l100 100H496V192z" />
  </svg>
);

// Icon: Receipt (Order Summary)
const FaReceipt = ({ size = "1em", className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    style={style}
    viewBox="0 0 512 512"
  >
    <path d="M432 0H80C62.3 0 48 14.3 48 32V480c0 17.7 14.3 32 32 32H432c17.7 0 32-14.3 32-32V32c0-17.7-14.3-32-32-32zM128 96h256v32H128V96zm256 320H128V384h256v32zm0-96H128V288h256v32zm0-96H128V192h256v32z" />
  </svg>
);

// Icon: Clock (Time Estimation)
const FaClock = ({ size = "1em", className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="currentColor"
    className={className}
    style={style}
    viewBox="0 0 512 512"
  >
    <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z" />
  </svg>
);

// --- MAIN COMPONENT ---
const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Stores the order details passed from the Checkout component via Router state
  const [orderData, setOrderData] = useState(null);
  // Stores enriched restaurant details (fetched via API)
  const [restaurant, setRestaurant] = useState(null); // Added state for fetched restaurant

  // Fallback estimated times if API data is missing (Key = Restaurant ID, Value = Minutes)
  const restaurantTimes = {
    1: 25,
    2: 35,
    3: 30,
    default: 25,
  };

  // --- Effect 1: Initialize Order Data ---
  useEffect(() => {
    // Check if order data was passed from Checkout
    if (location.state?.order) {
      setOrderData(location.state.order);
    } else {
      // If no order data (e.g., user navigated here manually), redirect logic
      // navigate('/home'); // Commented out to prevent immediate redirect in preview if state is lost
    }
  }, [location, navigate]);

  // --- Effect 2: Fetch Additional Restaurant Info ---
  // --- NEW: Fetch Restaurant Details from DB ---
  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      if (orderData?.restaurant_id) {
        try {
          // Fetch all restaurants to find the specific one related to this order
          // This ensures we get the most up-to-date 'preparing_time' and 'delivery_time'
          const { data } = await api.get("/restaurants");
          
          // Handle potential data wrapping { data: [...] } depending on API response format
          const restaurants = Array.isArray(data) ? data : data.data || [];

          const found = restaurants.find(
            (r) =>
              String(r.restaurant_id) === String(orderData.restaurant_id) ||
              String(r.id) === String(orderData.restaurant_id)
          );

          if (found) {
            setRestaurant(found);
          }
        } catch (err) {
          console.error("Failed to fetch restaurant info", err);
        }
      }
    };

    if (orderData) {
      fetchRestaurantInfo();
    }
  }, [orderData]);

  // Loading state while checking location.state
  if (!orderData) {
    return (
      <div className="auth-wrapper">
        <div className="spinner-border text-danger" role="status"></div>
      </div>
    );
  }

  // --- Calculation Logic ---
  // --- CHANGED: Use DB data if available, otherwise fallback ---
  // Calculates estimated time: (Preparing Time + Delivery Time) OR Fallback
  const estimatedTime = restaurant
    ? parseInt(restaurant.preparing_time || 0) +
      parseInt(restaurant.delivery_time || 0) || 30
    : restaurantTimes[orderData.restaurant_id] || restaurantTimes.default;

  // --- CHANGED: Use DB Name if available ---
  const displayName = orderData.restaurant_name || "Restaurant";

  // --- Render UI ---
  return (
    <div
      className="auth-wrapper"
      style={{
        minHeight: "100vh",
        height: "auto",
        padding: "20px 0",
      }}
    >
      <div
        className="auth-container"
        style={{
          maxWidth: "700px",
          minHeight: "auto",
          height: "auto",
          padding: "30px",
          overflow: "visible",
        }}
      >
        <div className="text-center">
          {/* Success Animation Icon */}
          <FaCheckCircle
            size={60}
            className="text-success mb-3"
            style={{ animation: "slideUpFade 0.8s ease" }}
          />

          <h2
            className="fw-bold mb-2"
            style={{ color: "#FF4B2B", fontSize: "1.8rem" }}
          >
            Order Placed Successfully!
          </h2>
          <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
            Your order is being prepared
          </p>

          {/* Order ID Badge */}
          <div className="bg-light rounded p-2 mb-3">
            <small className="text-muted d-flex align-items-center justify-content-center">
              <FaReceipt className="me-2" size={14} />
              Order ID: <strong className="ms-2">{orderData.order_id}</strong>
            </small>
          </div>

          {/* Restaurant & Time Information Box */}
          <div className="alert alert-info mb-3 py-2">
            {/* --- UPDATED LINE: Shows all restaurants (supports multi-restaurant orders) --- */}
            <strong>🍽 Restaurants:</strong>
            <div className="mt-2">
              {orderData.restaurants && orderData.restaurants.length > 0 ? (
                // If multiple restaurants, display as a list
                <ul
                  className="mb-2"
                  style={{ listStyle: "none", paddingLeft: 0 }}
                >
                  {orderData.restaurants.map((rest, idx) => (
                    <li key={idx} className="text-start">
                      <span className="badge bg-primary me-2">•</span>
                      {rest.name}
                    </li>
                  ))}
                </ul>
              ) : (
                // If single restaurant, display simple name
                <div className="text-start">
                  <span className="badge bg-primary me-2">•</span>
                  {displayName}
                </div>
              )}
            </div>
            
            {/* Delivery Time Estimation */}
            <div className="mt-2 pt-2 border-top">
              <FaClock className="me-1" size={14} />
              <small>
                Estimated delivery: <strong>{estimatedTime} minutes</strong>
              </small>
            </div>
          </div>

          {/* Order Items Summary */}
          <div className="text-start mb-3">
            <h6 className="fw-bold mb-2">Order Summary</h6>
            {orderData.items &&
              orderData.items.map((item, index) => (
                <div
                  key={index}
                  className="d-flex justify-content-between mb-1"
                  style={{ fontSize: "0.9rem" }}
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span className="fw-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            <hr className="my-2" />
            <div className="d-flex justify-content-between fs-6 fw-bold">
              <span>Total</span>
              <span style={{ color: "#FF4B2B" }}>${orderData.total}</span>
            </div>
          </div>

          {/* Delivery Address Display */}
          {orderData.address && (
            <div className="bg-light rounded p-2 mb-3 text-start">
              <small className="text-muted" style={{ fontSize: "0.8rem" }}>
                Delivering to:
              </small>
              <p className="mb-0 fw-bold" style={{ fontSize: "0.9rem" }}>
                {/* Handle string address vs object address format */}
                {typeof orderData.address === "string"
                  ? orderData.address
                  : `${orderData.address.street}, ${orderData.address.building}, ${orderData.address.city}`}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            {/* Track Order Button */}
            <Link to={`/order-tracking/${orderData.order_id}`}>
              <button
                className="auth-btn"
                style={{ padding: "10px 30px", fontSize: "0.8rem" }}
              >
                <FaMotorcycle className="me-2" /> Track Order
              </button>
            </Link>
            
            {/* View History Button */}
            <Link to="/order-history">
              <button
                className="auth-btn ghost"
                style={{
                  color: "#FF4B2B",
                  borderColor: "#FF4B2B",
                  padding: "10px 30px",
                  fontSize: "0.8rem",
                }}
              >
                View All Orders
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;