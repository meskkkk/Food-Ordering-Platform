import React, { useEffect, useState } from "react";
// Router import for navigation
import { Link } from "react-router-dom";
// Custom API service
import api from "../services/api";
// Icons
import { FaReceipt, FaMotorcycle, FaStar } from "react-icons/fa";
// Child component for handling ratings
import RatingComponent from "./RatingComponent";

const OrderHistory = () => {
  // --- State Management ---
  const [orders, setOrders] = useState([]); // Stores the list of past orders
  const [loading, setLoading] = useState(true); // UI loading state
  const [showRating, setShowRating] = useState(null); // Controls Rating Modal visibility (stores order object to be rated)
  const [tick, setTick] = useState(0); // Used to force re-renders for time-based status updates

  // Estimated times used for client-side status simulation (fallback if backend status is missing)
  const restaurantTimes = { default: { preparing: 15, delivery: 20 } };

  // --- Data Fetching & Polling ---
  useEffect(() => {
    let mounted = true; // Flag to prevent state updates on unmounted components

    const fetchOrders = async () => {
      try {
        console.log(
          "OrderHistory: token present?",
          localStorage.getItem("token") ? true : false
        );
        
        // Fetch orders from backend
        const response = await api.get("/orders/history");
        console.log("OrderHistory: /orders/history response", response);
        
        if (!mounted) return;
        // Handle different possible response structures
        setOrders(response.data || response.data?.orders || []);
      } catch (error) {
        console.error("Error fetching orders:", error);

        // FALLBACK: Load from localStorage if backend fails (Offline/Resilience mode)
        const localOrders = JSON.parse(localStorage.getItem("orders") || "[]");
        if (!mounted) return;
        setOrders(localOrders);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    // Initial fetch on mount
    fetchOrders();

    // Polling Mechanism: Re-fetch every 10 seconds to keep statuses up to date
    const poll = setInterval(fetchOrders, 10000);
    
    // Cleanup: Clear interval and set mounted flag to false
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, []);

  // --- Real-time Tick Effect ---
  // Forces the component to re-render every 10 seconds.
  // This ensures that "time-based" statuses (e.g., changing from Preparing to Delivery based on elapsed time)
  // update visually even if no new data comes from the API.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  // --- Loading View ---
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" role="status"></div>
        <p className="mt-3">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4 text-center" style={{ color: "#FF4B2B" }}>
        <FaReceipt className="me-2" /> My Orders
      </h2>

      {/* Removed test button to ensure rating uses real order data */}

      {/* --- Empty State --- */}
      {orders.length === 0 ? (
        <div className="text-center py-5">
          <div
            style={{ fontSize: "80px", opacity: "0.3", marginBottom: "1rem" }}
          >
            📦
          </div>
          <p className="text-muted fs-5">No orders yet</p>
          <Link to="/home">
            <button className="auth-btn">Start Ordering</button>
          </Link>
        </div>
      ) : (
        /* --- Order List --- */
        <div className="row">
          {orders.map((order) => {
            // --- Status Logic Start ---
            
            // 1. Determine creation time (handle various DB field names)
            const rawCreated =
              order.created_at ||
              order.order_date ||
              order.createdAt ||
              order.orderDate ||
              order.timestamp ||
              null;

            // 2. Fallback to current time if no timestamp found
            const calcCreated =
              rawCreated || order.created_at || new Date().toISOString();
            
            // 3. Calculate Elapsed Time (Client-side simulation)
            const now = new Date();
            const orderDate = new Date(calcCreated);
            const elapsedMinutes = Math.floor((now - orderDate) / 1000 / 60);
            const times = restaurantTimes.default;
            
            // 4. Determine status based purely on time (Simulated Status)
            let calcStatus = "Pending";
            if (elapsedMinutes < times.preparing) calcStatus = "Preparing";
            else if (elapsedMinutes < times.preparing + times.delivery)
              calcStatus = "Out for Delivery";
            else calcStatus = "Delivered";

            // 5. Check for actual Backend Status
            const backendStatusRaw =
              order.status || order.state || order.status_name || null;
            const backendStatus = backendStatusRaw
              ? String(backendStatusRaw).trim()
              : null;

            // 6. Final Display Status: Prefer Backend > Fallback to Time-based
            let displayStatus = backendStatus
              ? backendStatus.toLowerCase() === "cancelled" ||
                backendStatus.toLowerCase() === "canceled"
                ? "Cancelled"
                : backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)
              : calcStatus;

            // Normalize "delivered" capitalization
            if (displayStatus && displayStatus.toLowerCase() === "delivered")
              displayStatus = "Delivered";

            // 7. Determine Badge Color based on status
            const badgeClass =
              displayStatus === "Delivered"
                ? "bg-success"
                : displayStatus === "Preparing"
                ? "bg-warning text-dark"
                : displayStatus === "Out for Delivery"
                ? "bg-info text-dark"
                : "bg-secondary";
            
            // --- Status Logic End ---

            return (
              <div key={order.order_id || order.id} className="col-md-6 mb-4">
                <div className="card shadow-sm border-0 rounded-4 h-100">
                  <div className="card-body">
                    {/* Card Header: ID, Item Count, Status Badge */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold mb-0">
                        Order #{order.order_id || order.id} •{" "}
                        {Array.isArray(order.items)
                          ? order.items.reduce(
                              (s, it) => s + (parseInt(it.quantity) || 1),
                              0
                            )
                          : order.items_count ||
                            order.item_count ||
                            (order.items ? order.items.length : 0)}{" "}
                        items
                      </h5>
                      <span className={`badge ${badgeClass}`}>
                        {displayStatus}
                      </span>
                    </div>

                    {/* Restaurant Links (Handles Multi-Restaurant Orders) */}
                    {order.restaurants &&
                    Array.isArray(order.restaurants) &&
                    order.restaurants.length > 0 ? (
                      <div className="mb-2">
                        {order.restaurants.length === 1 ? (
                          // Single Restaurant: Clickable Link
                          <Link
                            to={`/restaurant/${order.restaurants[0].id}`}
                            className="text-decoration-none"
                          >
                            <p
                              className="text-muted mb-2"
                              style={{ cursor: "pointer" }}
                            >
                              🍽 {order.restaurants[0].name}
                            </p>
                          </Link>
                        ) : (
                          // Multiple Restaurants: Just list names
                          <p
                            className="text-muted mb-2"
                            style={{ cursor: "default" }}
                          >
                            🍽 {order.restaurants.map((r) => r.name).join(", ")}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Fallback for older data structure (single restaurant_name field)
                      order.restaurant_name && (
                        <Link
                          to={`/restaurant/${order.restaurant_id}`}
                          className="text-decoration-none"
                        >
                          <p
                            className="text-muted mb-2"
                            style={{ cursor: "pointer" }}
                          >
                            🍽 {order.restaurant_name}
                          </p>
                        </Link>
                      )
                    )}

                    {/* Timestamp Display */}
                    <p className="text-muted small mb-3">
                      {calcCreated
                        ? new Date(calcCreated).toLocaleDateString()
                        : ""}{" "}
                      at{" "}
                      {calcCreated
                        ? new Date(calcCreated).toLocaleTimeString()
                        : ""}
                    </p>

                    {/* Total Amount */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold">Total:</span>
                      <span
                        className="fs-5 fw-bold"
                        style={{ color: "#FF4B2B" }}
                      >
                        $
                        {parseFloat(
                          order.total_amount || order.total || 0
                        ).toFixed(2)}
                      </span>
                    </div>

                    {/* Action Buttons: Track & Rate */}
                    <div className="d-flex gap-2">
                      <Link
                        to={`/order-tracking/${order.order_id || order.id}`}
                        className="flex-grow-1"
                      >
                        <button className="btn btn-outline-danger w-100 rounded-pill">
                          <FaMotorcycle className="me-2" /> Track
                        </button>
                      </Link>

                      {/* Rate Button: Only visible if Delivered */}
                      {displayStatus === "Delivered" && (
                        <button
                          className="btn btn-warning rounded-pill px-3"
                          onClick={() =>
                            setShowRating({
                              ...order,
                              // Normalize restaurant ID/Name for the Rating Component
                              restaurant_id:
                                order.restaurant_id ||
                                order.restaurants?.[0]?.id ||
                                order.restaurants?.[0]?.restaurant_id,
                              restaurant_name:
                                order.restaurant_name ||
                                order.restaurants?.[0]?.name ||
                                order.restaurants?.[0]?.restaurant_name,
                            })
                          }
                        >
                          <FaStar className="me-1 mb-1" /> Rate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rating Modal (Conditionally Rendered) */}
      {showRating && (
        <RatingComponent
          order={showRating}
          onClose={() => setShowRating(null)}
        />
      )}
    </div>
  );
};

export default OrderHistory;