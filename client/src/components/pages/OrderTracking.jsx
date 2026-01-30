import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import {
  FaCheckCircle,
  FaClock,
  FaMotorcycle,
  FaBox,
  FaUtensils,
} from "react-icons/fa";

const OrderTracking = () => {
  // --- State & Hooks ---
  const { id } = useParams(); // Get Order ID from URL
  const [order, setOrder] = useState(null); // Stores the full order object
  const [loading, setLoading] = useState(true); // Loading state for initial fetch
  const [error, setError] = useState(null); // Error handling state
  const [currentStatus, setCurrentStatus] = useState("Pending"); // The active status to display
  const [estimatedTime, setEstimatedTime] = useState(null); // Estimated minutes remaining
  const [statusMessage, setStatusMessage] = useState(""); // User-friendly message (e.g., "On the way!")
  
  // Ref to track if data has been fetched at least once (to avoid repetitive loading spinners on poll)
  const initialFetchedRef = useRef(false);

  // --- Configuration ---
  // Default time intervals (in minutes) for simulating status progression
  // Used as a fallback if the backend doesn't provide specific timestamps or status
  const restaurantTimes = {
    default: { preparing: 15, delivery: 20, total: 35, name: "Restaurant" },
  };

  /**
   * Helper function to calculate status based on elapsed time.
   * This is a CLIENT-SIDE SIMULATION used when the backend status is missing or generic.
   */
  const calculateStatus = (createdAt, restaurantId) => {
    const now = new Date();
    const orderDate = new Date(createdAt);
    // Calculate minutes passed since order creation
    const elapsedMinutes = Math.floor((now - orderDate) / 1000 / 60);

    // Use default times configuration
    const times = restaurantTimes.default;

    // Determine status based on time thresholds
    if (elapsedMinutes < times.preparing) {
      return {
        status: "Preparing",
        timeLeft: times.preparing - elapsedMinutes,
        message: `The restaurant is preparing your delicious food! 👨‍🍳`,
      };
    } else if (elapsedMinutes < times.preparing + times.delivery) {
      return {
        status: "Out for Delivery",
        timeLeft: times.preparing + times.delivery - elapsedMinutes,
        message: `Your order is on the way! 🏍`,
      };
    } else {
      return {
        status: "Delivered",
        timeLeft: 0,
        message: `Enjoy your meal! 🎉`,
      };
    }
  };

  /**
   * Main function to fetch order details from API.
   * Handles both data retrieval and status determination logic.
   */
  const fetchOrderStatus = async () => {
    const isInitial = !order; // Check if this is the first load
    try {
      // Only show full-screen loading spinner on first fetch
      if (isInitial) setLoading(true);
      setError(null);

      // --- API Call ---
      const response = await api.get(`/orders/${id}`);
      console.log("OrderTracking: fetched order", response);
      const orderData = response.data;

      if (!orderData) {
        throw new Error("Order data is empty");
      }

      setOrder(orderData);

      // --- Status Logic ---
      // 1. Calculate a "Simulated" status first (fallback)
      const restaurantId = orderData.restaurant_id || 0;
      const createdAt =
        orderData.created_at ||
        orderData.order_date ||
        new Date().toISOString();

      const {
        status: calcStatus,
        timeLeft: calcTimeLeft,
        message: calcMessage,
      } = calculateStatus(createdAt, restaurantId);

      // 2. Resolve Final Status: Prefer Backend Data > Fallback Simulation
      let finalStatus = calcStatus;
      let finalTimeLeft = calcTimeLeft;
      let finalMessage = calcMessage;

      if (orderData.status) {
        const backendStatus = String(orderData.status).trim();
        const backendLower = backendStatus.toLowerCase();

        // Map backend status strings to UI display states
        if (backendLower === "preparing") {
          finalStatus = "Preparing";
          finalMessage = "The restaurant is preparing your delicious food! 👨‍🍳";
        } else if (backendLower === "on the way") {
          finalStatus = "Out for Delivery";
          finalMessage = "Your order is on the way! 🏍";
        } else if (backendLower === "delivered") {
          finalStatus = "Delivered";
          finalTimeLeft = 0;
          finalMessage = "Your order has been delivered! 🎉";
        } else if (backendLower === "cancelled") {
          finalStatus = "Cancelled";
          finalMessage = "This order was cancelled.";
        } else {
          // Handle unknown/custom statuses dynamically
          finalStatus =
            backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1);
          finalMessage = `Order status: ${finalStatus}`;
        }
      }

      // Update UI state
      setCurrentStatus(finalStatus);
      setEstimatedTime(finalTimeLeft);
      setStatusMessage(finalMessage);
    } catch (err) {
      console.error("❌ Error fetching order:", err);
      setError("Could not load order details. Please check the Order ID.");
      setOrder(null);
    } finally {
      // Turn off loading spinner
      if (isInitial) setLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    // 1. Fetch immediately on mount
    fetchOrderStatus();

    // 2. Set up Polling: Re-fetch every 10 seconds
    // This ensures the user sees updates (like "Out for Delivery") without refreshing
    const interval = setInterval(() => {
      fetchOrderStatus();
    }, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [id]);

  // --- Render: Loading State ---
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Loading order details...</p>
      </div>
    );
  }

  // --- Render: Error State ---
  if (error || !order) {
    return (
      <div className="container py-5 text-center">
        <h3 className="text-danger">Order Not Found</h3>
        <p className="text-muted">
          {error || "We couldn't locate this order."}
        </p>
        <Link to="/order-history">
          <button className="btn btn-outline-primary mt-3">
            Back to Order History
          </button>
        </Link>
      </div>
    );
  }

  // Define the ordered steps for the progress bar
  const statuses = ["Pending", "Preparing", "Out for Delivery", "Delivered"];
  // Determine which step is active based on current status string
  let currentStatusIndex = statuses.findIndex(
    (s) => s.toLowerCase() === (currentStatus || "").toLowerCase()
  );
  if (currentStatusIndex === -1) currentStatusIndex = 0; // Default to first step if status matches none

  // --- Render: Main UI ---
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-lg border-0 rounded-4">
            <div className="card-body p-5">
              <h2
                className="fw-bold mb-4 text-center"
                style={{ color: "#FF4B2B" }}
              >
                Track Your Order
              </h2>

              <div className="text-center mb-4">
                <span className="badge bg-secondary fs-6 px-3 py-2">
                  Order #{order.order_id || order.id || id}
                </span>
              </div>

              {/* --- RESTAURANT INFO SECTION --- */}
              <div className="alert alert-light mb-4 border">
                <div className="text-center">
                  <FaUtensils className="me-2" style={{ color: "#FF4B2B" }} />
                  <strong>Restaurants:</strong>
                </div>
                {/* Logic to handle single vs multiple restaurants */}
                {order.restaurants &&
                Array.isArray(order.restaurants) &&
                order.restaurants.length > 0 ? (
                  <ul
                    style={{
                      listStyle: "none",
                      paddingLeft: 0,
                      marginTop: "10px",
                      marginBottom: 0,
                    }}
                  >
                    {order.restaurants.map((rest, idx) => (
                      <li key={idx} className="text-center">
                        <span className="badge bg-primary me-2">•</span>
                        {rest.name || rest}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center" style={{ marginTop: "10px" }}>
                    {order.restaurant_name || "Restaurant"}
                  </div>
                )}
              </div>

              {/* --- STATUS ALERTS --- */}
              {/* Message Alert */}
              <div
                className={`alert ${
                  currentStatus === "Delivered" ? "alert-success" : "alert-info"
                } text-center mb-4`}
              >
                <strong>{statusMessage}</strong>
              </div>

              {/* Time Remaining Alert (Hidden if delivered/cancelled) */}
              {currentStatus !== "Delivered" &&
                currentStatus !== "Cancelled" &&
                estimatedTime > 0 && (
                  <div className="alert alert-warning text-center mb-4">
                    <FaClock className="me-2" />
                    <strong>
                      Estimated time remaining: {estimatedTime} minutes
                    </strong>
                  </div>
                )}

              {/* --- VISUAL PROGRESS BAR --- */}
              <div className="position-relative mb-5 mt-5">
                {statuses.map((status, index) => (
                  <div
                    key={status}
                    className="d-flex align-items-center mb-4 position-relative"
                  >
                    {/* Dashed Connecting Line logic */}
                    {index < statuses.length - 1 && (
                      <div
                        className="position-absolute"
                        style={{
                          left: "24px",
                          top: "50px",
                          height: "30px",
                          // Green line for completed steps, Gray for upcoming
                          borderLeft: `2px dashed ${
                            index < currentStatusIndex ? "#198754" : "#dee2e6"
                          }`,
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Status Circle Icon */}
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center ${
                        index <= currentStatusIndex
                          ? "bg-success" // Active/Passed color
                          : "bg-secondary" // Inactive color
                      }`}
                      style={{
                        width: "50px",
                        height: "50px",
                        zIndex: 2,
                        minWidth: "50px",
                      }}
                    >
                      {/* Render specific icon for each status */}
                      {status === "Pending" && (
                        <FaClock className="text-white" size={20} />
                      )}
                      {status === "Preparing" && (
                        <FaBox className="text-white" size={20} />
                      )}
                      {status === "Out for Delivery" && (
                        <FaMotorcycle className="text-white" size={20} />
                      )}
                      {status === "Delivered" && (
                        <FaCheckCircle className="text-white" size={20} />
                      )}
                    </div>

                    {/* Status Text Label */}
                    <div className="ms-3">
                      <h6
                        className={`mb-0 fw-bold ${
                          index <= currentStatusIndex
                            ? "text-success"
                            : "text-muted"
                        }`}
                      >
                        {status}
                      </h6>
                      {/* "Current Status" indicator text */}
                      {index === currentStatusIndex && (
                        <small className="text-success fw-bold d-block">
                          ● Current Status
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* --- ORDER DETAILS LIST --- */}
              <hr className="my-4" />
              <h5 className="fw-bold mb-3">Order Details</h5>
              {order.items && Array.isArray(order.items) ? (
                // IIFE (Immediately Invoked Function Expression) to handle grouping logic cleanly
                (() => {
                  // Group items by restaurant name to display them in sections
                  const groupedByRestaurant = {};
                  order.items.forEach((item) => {
                    const restaurantName = item.restaurant_name || "Other";
                    if (!groupedByRestaurant[restaurantName]) {
                      groupedByRestaurant[restaurantName] = [];
                    }
                    groupedByRestaurant[restaurantName].push(item);
                  });

                  // Check if this is a multi-restaurant order
                  const multipleRestaurants =
                    Object.keys(groupedByRestaurant).length > 1;

                  // Render groups
                  return Object.entries(groupedByRestaurant).map(
                    ([restaurantName, items]) => (
                      <div key={restaurantName}>
                        {/* Show Restaurant Header only if multiple restaurants exist */}
                        {multipleRestaurants && (
                          <div
                            className="mb-3 p-2 bg-light rounded border-start border-4"
                            style={{ borderColor: "#FF4B2B" }}
                          >
                            <small className="text-muted">From:</small>
                            <p className="mb-0 fw-bold text-dark">
                              {restaurantName}
                            </p>
                          </div>
                        )}
                        {/* List items for this restaurant */}
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="d-flex justify-content-between mb-2"
                          >
                            <span>
                              {item.name || "Item"} x{item.quantity}
                            </span>
                            <span className="fw-bold">
                              $
                              {(
                                parseFloat(item.price || 0) *
                                parseInt(item.quantity || 1)
                              ).toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {multipleRestaurants && <hr className="my-2" />}
                      </div>
                    )
                  );
                })()
              ) : (
                <p className="text-muted small">Items details not available.</p>
              )}

              <hr />
              {/* Total Amount Display */}
              <div className="d-flex justify-content-between fs-5 fw-bold">
                <span>Total</span>
                <span style={{ color: "#FF4B2B" }}>
                  $
                  {order.total_amount
                    ? parseFloat(order.total_amount).toFixed(2)
                    : "0.00"}
                </span>
              </div>

              {/* Delivery Address Section */}
              <div className="bg-light rounded p-3 mt-4">
                <small className="text-muted">Delivery Address:</small>
                <p className="mb-0 fw-bold">
                  {/* Logic to handle address as string OR object */}
                  {typeof order.delivery_address === "string"
                    ? order.delivery_address
                    : typeof order.address === "string"
                    ? order.address
                    : order.address && typeof order.address === "object"
                    ? `${order.address.street || ""}, ${
                        order.address.building || ""
                      }, ${order.address.city || ""}`
                    : "Address not specified"}
                </p>
              </div>

              {/* Navigation Back Button */}
              <div className="text-center mt-4">
                <Link to="/order-history">
                  <button
                    className="auth-btn"
                    style={{ padding: "10px 30px", fontSize: "0.9rem" }}
                  >
                    View All Orders
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;