import React, { useState } from "react";
// Custom API service for making HTTP requests
import api from "../services/api";
// Star icon for the rating UI from react-icons library
import { FaStar } from "react-icons/fa";

/**
 * RatingComponent
 * A modal that allows users to rate individual items within an order
 * and leave an overall comment.
 *
 * Props:
 * - order: The order object containing items to rate.
 * - onClose: Function to close the modal.
 */
const RatingComponent = ({ order, onClose }) => {
  // --- State Management ---

  // Rating State:
  // We use the array index (0, 1, 2...) as the key instead of the Item ID.
  // This is a crucial strategy to handle edge cases where an order might contain
  // duplicate items (e.g., "Burger" x 1 and another "Burger" x 1 separately).
  // Using the index ensures every row in the UI has its own independent state.
  const [itemRatings, setItemRatings] = useState({});

  // Hover State:
  // Tracks which star is currently being hovered over for visual feedback.
  // Also indexed by array position to correspond with the rating state.
  const [itemHovers, setItemHovers] = useState({});

  // Review Comment: Stores the optional text feedback.
  const [comment, setComment] = useState("");

  // Loading State: Disables buttons while the API request is in progress.
  const [loading, setLoading] = useState(false);

  // --- Safety Check ---
  // If the parent component passes a null order, do not render anything.
  if (!order) return null;

  // Extract items safely, defaulting to an empty array to prevent crashes.
  const orderItems = order.items || [];

  // --- Event Handlers ---

  /**
   * Updates the rating for a specific item row.
   * @param {number} index - The index of the item in the list.
   * @param {number} rating - The number of stars selected (1-5).
   */
  const handleItemRating = (index, rating) => {
    setItemRatings((prev) => ({
      ...prev,
      [index]: rating,
    }));
  };

  /**
   * Updates the hover state to show potential rating selection visually.
   * @param {number} index - The index of the item.
   * @param {number} rating - The star number being hovered.
   */
  const handleItemHover = (index, rating) => {
    setItemHovers((prev) => ({
      ...prev,
      [index]: rating,
    }));
  };

  /**
   * Resets the hover state when the mouse leaves the star area.
   * @param {number} index - The index of the item.
   */
  const handleItemHoverLeave = (index) => {
    setItemHovers((prev) => ({
      ...prev,
      [index]: 0,
    }));
  };

  // --- Submission Logic ---
  const handleSubmit = async () => {
    // 1. Validation
    // Ensure the user has actually rated at least one item before submitting.
    if (Object.keys(itemRatings).length === 0) {
      alert("Please rate at least one item");
      return;
    }

    setLoading(true);

    try {
      // 2. ID Extraction
      // Determine the Restaurant ID. The logic checks multiple possible field names
      // because the order object structure might vary depending on the API endpoint used.
      const restaurantId =
        order.restaurant_id ||
        order.restaurants?.[0]?.id ||
        order.restaurants?.[0]?.restaurant_id ||
        order.restaurantId ||
        null;

      // Determine Order ID
      const orderId = order.order_id || order.id || order.orderId || null;

      if (!restaurantId) {
        alert("Cannot determine restaurant for this review.");
        setLoading(false);
        return;
      }

      // 3. Authentication Check
      // Verify that the user is logged in by checking for the token.
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to submit a review.");
        setLoading(false);
        return;
      }

      // 4. Data Transformation
      // The UI state uses indices (0, 1) to separate identical items.
      // However, the backend expects Item IDs (101, 102).
      // We iterate through our index-based state and map values back to the actual Item IDs.
      const finalItemRatings = {};

      Object.keys(itemRatings).forEach((index) => {
        const item = orderItems[index]; // Retrieve the actual item object
        const rating = itemRatings[index]; // Retrieve the user's rating

        // Use the backend ID (e.g., food_item_id or id) as the key for the API.
        const backendId = item.id || item.food_item_id;

        // Populate the payload object.
        // Note: If duplicate IDs exist in the order, the last one processed here
        // will overwrite the previous ones for that specific ID.
        finalItemRatings[backendId] = rating;
      });

      // 5. Construct Payload
      const payload = {
        order_id: orderId,
        item_ratings: finalItemRatings, // The transformed ID-based object
        comment,
      };

      console.log("Submitting review payload", { restaurantId, payload });

      // 6. Network Request
      // Send POST request to the review endpoint
      const resp = await api.post(`/reviews/${restaurantId}/review`, payload);

      console.log("Review response:", resp);
      alert(resp.data?.message || "Thank you for your review!");
      onClose(); // Close the modal on successful submission
    } catch (error) {
      // 7. Error Handling
      console.error("Error submitting review:", error);

      if (error.response) {
        // Handle server-side errors (4xx, 5xx)
        const status = error.response.status;
        const data = error.response.data || {};
        const msg = data.error || data.message || JSON.stringify(data);

        if (status === 401) {
          alert("Unauthorized: please log in and try again.");
        } else if (status === 403) {
          alert(`Forbidden: ${msg} (you may not own this order)`);
        } else {
          alert(`Error submitting review: ${msg}`);
        }
      } else {
        // Handle network errors (offline, timeout)
        alert(`Error submitting review: ${error.message}`);
      }
    } finally {
      // Reset loading state regardless of success or failure
      setLoading(false);
    }
  };

  return (
    // --- Modal Overlay ---
    // Covers the entire screen with a semi-transparent background
    <div
      className="modal d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999 }}
      onClick={onClose} // Clicking the background closes the modal
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()} // Stop click propagation to prevent closing when clicking inside the modal
      >
        <div className="modal-content rounded-4">
          {/* --- Modal Header --- */}
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">Rate Your Order</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* --- Modal Body --- */}
          <div className="modal-body">
            {/* Context Info: Which order is being rated */}
            <p className="text-muted mb-4">
              Order #{order.order_id || order.id}
              {order.restaurant_name && ` from ${order.restaurant_name}`}
            </p>

            {/* --- Items List --- */}
            {orderItems.length > 0 ? (
              <>
                <h6 className="fw-bold mb-3">Rate Each Item:</h6>
                {/* Loop through items using map.
                    We expose 'index' to handle the UI state logic explained above.
                */}
                {orderItems.map((item, index) => (
                  <div
                    // Use index as the key to ensure React renders unique components
                    // even if item.id contains duplicates.
                    key={index}
                    className="card mb-3 p-3"
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      {/* Item Details */}
                      <div>
                        <h6 className="mb-0">{item.name}</h6>
                        <small className="text-muted">
                          Quantity: {item.quantity}
                        </small>
                      </div>

                      {/* Star Rating Controls */}
                      <div>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            size={30}
                            className="mx-1"
                            style={{ cursor: "pointer" }}
                            // Star Coloring Logic:
                            // Check if this star's value is less than or equal to:
                            // 1. The current hover state for this row (if hovering)
                            // 2. OR the saved rating for this row (if not hovering)
                            // If yes, color it Gold (#ffc107), otherwise Gray (#e4e5e9).
                            color={
                              star <=
                              (itemHovers[index] ||
                                itemRatings[index] ||
                                0)
                                ? "#ffc107"
                                : "#e4e5e9"
                            }
                            // Interaction Handlers:
                            // We pass 'index' so the handler knows exactly which row to update.
                            onClick={() => handleItemRating(index, star)}
                            onMouseEnter={() => handleItemHover(index, star)}
                            onMouseLeave={() => handleItemHoverLeave(index)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // Fallback if the order has no items (rare edge case)
              <div className="alert alert-warning">
                No items found in this order.
              </div>
            )}

            {/* --- Overall Comment Input --- */}
            <h6 className="fw-bold mb-2 mt-4">Overall Experience:</h6>
            <textarea
              className="form-control mb-3"
              rows="3"
              placeholder="Share your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>

            {/* --- Submit Button --- */}
            <button
              className="auth-btn w-100"
              onClick={handleSubmit}
              disabled={loading || orderItems.length === 0}
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingComponent;