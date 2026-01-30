import React, { useState, useContext, useEffect } from "react";
// Context imports for managing Cart state and User Authentication state globally
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
// Router hook for navigation after order placement
import { useNavigate } from "react-router-dom";
// Custom Axios instance for API requests
import api from "../services/api";

const Checkout = () => {
  // --- Global State Access ---
  // Access cart items and the function to clear cart from CartContext
  const { cartItems, clearCart } = useContext(CartContext);
  // Access the current logged-in user from AuthContext
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Local State Management ---
  // Stores the list of addresses fetched from the backend
  const [addresses, setAddresses] = useState([]);
  // Stores the currently selected address for delivery
  const [selectedAddress, setSelectedAddress] = useState(null);
  // Toggles the visibility of the "Add New Address" form
  const [showAddressForm, setShowAddressForm] = useState(false);
  // Stores the selected payment method (defaulted to "cash")
  const [paymentMethod, setPaymentMethod] = useState("cash");
  // Loading state for the "Place Order" button to prevent double submissions
  const [isProcessing, setIsProcessing] = useState(false);

  // State for the new address form inputs
  const [addressForm, setAddressForm] = useState({
    city: "",
    street: "",
    building: "",
    apartment: "",
    floor: "",
    label: "Home",
  });

  // --- Helper Functions ---
  // Calculates the subtotal of items in the cart
  const getTotalPrice = () => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // --- Side Effects ---
  // Fetch user addresses from the backend when the component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        console.log("📡 Loading addresses from /locations...");
        const response = await api.get("/locations");
        console.log("✅ Addresses loaded:", response.data);
        // Update state with fetched addresses or empty array if null
        setAddresses(response.data || []);
      } catch (error) {
        console.error("❌ Error loading addresses:", error);
        console.error("Error details:", error.response?.data);
      }
    };
    loadAddresses();
  }, []);

  // --- Event Handlers ---

  /**
   * Handles the submission of the new address form.
   * Sends data to backend and updates local list upon success.
   */
  const saveAddress = async (e) => {
    e.preventDefault();

    try {
      console.log("💾 Saving new address...");
      // Construct payload for the API
      const payload = {
        street: addressForm.street,
        building: addressForm.building || null,
        apartment: addressForm.apartment || null,
        city: addressForm.city,
        floor: addressForm.floor || null,
      };

      console.log("Address payload:", payload);
      // Send POST request to create new location
      const response = await api.post("/locations", payload); // REMOVED manual headers
      console.log("✅ Address saved:", response.data);

      // Create a local object with the new ID to update UI immediately
      const savedAddress = {
        ...addressForm,
        location_id: response.data.locationId,
      };

      // Update the addresses list and auto-select the new address
      setAddresses([...addresses, savedAddress]);
      setSelectedAddress(savedAddress);
      // Hide the form and reset inputs
      setShowAddressForm(false);
      setAddressForm({
        city: "",
        street: "",
        building: "",
        apartment: "",
        floor: "",
        label: "Home",
      });
    } catch (err) {
      console.error("❌ Error saving address:", err);
      console.error("Error details:", err.response?.data);
      alert(
        "Failed to save address: " + (err.response?.data?.error || err.message)
      );
    }
  };

  /**
   * Main function to handle order placement.
   * Validates inputs, constructs order payload, and calls API.
   */
  const handlePlaceOrder = async () => {
    console.log("🔍 ===== STARTING ORDER PLACEMENT =====");
    // Debugging logs for current state
    console.log("User:", user);
    console.log("Token in localStorage:", localStorage.getItem("token"));
    console.log("Cart items:", cartItems);
    console.log("Selected address:", selectedAddress);
    console.log("API baseURL:", api.defaults.baseURL);

    // --- Validation Checks ---
    if (!user) {
      alert("You must be logged in to place an order.");
      return;
    }

    if (!selectedAddress) {
      alert("Please select a delivery address.");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      // Set processing state to disable button
      setIsProcessing(true);

      // 🚨 CRITICAL FIX: Remove user_id from payload
      // Backend gets user_id from token via authenticateToken middleware
      const payload = {
        user_id: user.user_id || user.id, // Fallback for ID property name
        locationId: selectedAddress.location_id,
        payment_method: paymentMethod,
        // Calculate total amount on client side (Backend should also verify this)
        total_amount: cartItems.reduce((sum, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseInt(item.quantity) || 0;
          return sum + price * quantity;
        }, 0),
        // Map cart items to the format expected by the backend
        items: cartItems.map((item) => ({
          itemId: item.id || item.item_id, // Make sure this matches your database items.item_id
          quantity: parseInt(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
        })),
      };

      console.log("📦 Order payload to backend:", payload);
      console.log("📤 Sending to POST /orders...");

      // 🚨 CRITICAL FIX: Remove manual headers
      // api.js interceptor already adds Authorization header
      const response = await api.post("/orders", payload); // REMOVED manual headers

      console.log("✅ Order response:", response.data);

      if (response.data && response.data.orderId) {
        // --- Success Handling ---
        // Prepare complete order data for success page display
        // Collect all unique restaurants from cart items (for multi-restaurant orders)
        const uniqueRestaurants = [
          ...new Map(
            cartItems.map((item) => [
              item.restaurant_id,
              { id: item.restaurant_id, name: item.restaurant_name },
            ])
          ).values(),
        ];

        // Construct object to pass via router state
        const orderData = {
          order_id: response.data.orderId,
          restaurant_id: cartItems[0]?.restaurant_id,
          restaurant_name: cartItems[0]?.restaurant_name || "Restaurant",
          restaurants: uniqueRestaurants,
          total: (getTotalPrice() + 2.99).toFixed(2), // Adding fixed delivery fee
          items: cartItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            restaurant_name: item.restaurant_name,
          })),
          address: selectedAddress,
          payment_method: paymentMethod,
          created_at: new Date().toISOString(),
        };

        console.log("📄 Order data for success page:", orderData);

        // Clear global cart state
        clearCart();

        // Navigate to success page with the order details
        console.log("➡️ Navigating to /order-success...");
        navigate("/order-success", {
          state: { order: orderData },
        });
      } else {
        console.error("❌ Invalid response from server - no orderId");
        throw new Error("Invalid response from server - no orderId received");
      }
    } catch (err) {
      // --- Error Handling ---
      console.error("❌ Order placement failed!");
      console.error("Error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);

      // Determine the specific error message to show user
      let errorMessage = "Order failed. Please try again.";

      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      alert(`Order Error: ${errorMessage}`);
    } finally {
      // Reset processing state regardless of success or failure
      setIsProcessing(false);
      console.log("🔍 ===== ORDER PLACEMENT COMPLETE =====");
    }
  };

  // --- JSX Render ---
  return (
    <div className="container my-5">
      <h1 className="fw-bold mb-4">Checkout</h1>

      <div className="row">
        {/* --- Left Column: Address and Payment --- */}
        <div className="col-lg-8">
          {/* Address Section */}
          <div
            className="card shadow-sm border-0 mb-4"
            style={{ borderRadius: "15px" }}
          >
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold">
                  <span className="me-2" style={{ color: "#dc3545" }}>
                    📍
                  </span>
                  Delivery Address
                </h5>
                {/* Button to toggle Address Form */}
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  {showAddressForm ? "Cancel" : "+ Add New"}
                </button>
              </div>

              {/* Address Form (Conditionally Rendered) */}
              {showAddressForm && (
                <form
                  onSubmit={saveAddress}
                  className="mb-3 p-3 border rounded"
                >
                  <select
                    className="form-select form-select-sm mb-2"
                    value={addressForm.label}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, label: e.target.value })
                    }
                  >
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>

                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Street"
                    value={addressForm.street}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, street: e.target.value })
                    }
                    required
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Building"
                    value={addressForm.building}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        building: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Apartment"
                    value={addressForm.apartment}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        apartment: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Floor"
                    value={addressForm.floor}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, floor: e.target.value })
                    }
                  />

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm w-100"
                  >
                    Save Address
                  </button>
                </form>
              )}

              {/* List of Existing Addresses */}
              <div className="row">
                {addresses.map((addr) => (
                  <div key={addr.location_id} className="col-md-6 mb-2">
                    <div
                      // Conditional class for highlighting selected address
                      className={`card h-100 ${
                        selectedAddress?.location_id === addr.location_id
                          ? "border-primary"
                          : ""
                      }`}
                      style={{
                        borderRadius: "10px",
                        cursor: "pointer",
                        borderWidth: "2px",
                      }}
                      onClick={() => setSelectedAddress(addr)}
                    >
                      <div className="card-body p-3">
                        <span className="badge bg-primary mb-2">
                          {addr.label}
                        </span>
                        <p className="mb-0 small">
                          <strong>{addr.city}</strong>
                        </p>
                        <p className="mb-0 small">
                          {addr.street}, {addr.building}
                        </p>
                        {/* Visual indicator for selection */}
                        {selectedAddress?.location_id === addr.location_id && (
                          <span className="badge bg-success mt-2">
                            ✓ Selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State for Addresses */}
              {addresses.length === 0 && !showAddressForm && (
                <div className="text-center text-muted py-3">
                  <p>No addresses saved. Add one to continue!</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Section */}
          <div
            className="card shadow-sm border-0 mb-4"
            style={{ borderRadius: "15px" }}
          >
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">
                <span className="me-2" style={{ color: "#0d6efd" }}>
                  💳
                </span>
                Payment Method
              </h5>

              {/* Cash Option */}
              <div
                className="form-check mb-3 p-3 border rounded"
                style={{ cursor: "pointer" }}
                onClick={() => setPaymentMethod("cash")}
              >
                <input
                  className="form-check-input"
                  type="radio"
                  checked={paymentMethod === "cash"}
                  readOnly
                />
                <label
                  className="form-check-label w-100"
                  style={{ cursor: "pointer" }}
                >
                  💵 Cash on Delivery
                </label>
              </div>

              {/* Card Option */}
              <div
                className="form-check p-3 border rounded"
                style={{ cursor: "pointer" }}
                onClick={() => setPaymentMethod("card")}
              >
                <input
                  className="form-check-input"
                  type="radio"
                  checked={paymentMethod === "card"}
                  readOnly
                />
                <label
                  className="form-check-label w-100"
                  style={{ cursor: "pointer" }}
                >
                  💳 Credit/Debit Card
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Column: Order Summary --- */}
        <div className="col-lg-4">
          <div
            className="card shadow-sm border-0 sticky-top"
            style={{ borderRadius: "15px", top: "20px" }}
          >
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Order Summary</h5>

              {/* Loop through cart items */}
              {cartItems.map((item) => (
                <div
                  key={item.item_id}
                  className="d-flex justify-content-between mb-2"
                >
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}

              <hr />
              {/* Financial Totals */}
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Delivery Fee</span>
                <span>$2.99</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4">
                <h5 className="fw-bold">Total</h5>
                <h5 className="fw-bold" style={{ color: "#FF4B2B" }}>
                  ${(getTotalPrice() + 2.99).toFixed(2)}
                </h5>
              </div>

              {/* Place Order Button */}
              <button
                className="auth-btn w-100"
                onClick={handlePlaceOrder}
                // Disable button if processing or no address selected
                disabled={isProcessing || !selectedAddress}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;