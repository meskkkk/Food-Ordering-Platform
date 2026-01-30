// ==================== IMPORTS ====================
import React, { useState, useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

// ==================== HELPER FUNCTION ====================
// Ensures images load correctly from local server or external URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return ""; // Prevents errors if image is missing
  if (imagePath.startsWith("http")) return imagePath; // If already full URL
  return `http://localhost:3000${imagePath}`; // Prepend backend URL
};

// ==================== REUSABLE COMPONENT: BROWSE BUTTON ====================
// Simple button that navigates user to homepage
const BrowseButton = () => {
  const navigate = useNavigate();
  return (
    <button
      className="btn mt-3 fw-bold px-4 py-2"
      style={{ backgroundColor: "#FF4B2B", borderColor: "#FF4B2B", color: "white", borderRadius: "20px" }}
      onClick={() => navigate("/")}
    >
      Browse Restaurants
    </button>
  );
};

// ==================== EMPTY CART COMPONENT ====================
// Displayed when the cart is empty
const EmptyCart = () => (
  <div className="text-center py-5 mt-5">
    <div style={{ fontSize: "60px", marginBottom: "20px" }}>🛒</div>
    <h2 className="fw-bold">Your cart is empty</h2>
    <p className="text-muted">Looks like you haven't added anything yet.</p>
    <BrowseButton />
  </div>
);

// ==================== ORDER TOTALS (REUSABLE) ====================
// Shows subtotal, delivery fee, and total price
const OrderTotals = ({ cartTotal }) => (
  <>
    <div className="d-flex justify-content-between mb-2">
      <span className="text-muted">Subtotal</span>
      <span>${cartTotal.toFixed(2)}</span>
    </div>
    <div className="d-flex justify-content-between mb-3">
      <span className="text-muted">Delivery Fee</span>
      <span>$2.99</span>
    </div>
    <hr />
    <div className="d-flex justify-content-between mb-4">
      <strong className="fs-5">Total</strong>
      <strong className="fs-5" style={{ color: "#FF4B2B" }}>${(cartTotal + 2.99).toFixed(2)}</strong>
    </div>
  </>
);

// ==================== ADDRESS MANAGER ====================
// Handles adding, selecting, and deleting user delivery addresses
const AddressManager = ({ selectedAddress, onSelectAddress }) => {
  const [addresses, setAddresses] = useState([]); // Stores saved addresses
  const [showForm, setShowForm] = useState(false); // Toggles address form

  const [formData, setFormData] = useState({
    city: "",
    street: "",
    building: "",
    label: "Home", // Default label type
  });

  // Saves a new address to state
  const saveAddress = (e) => {
    e.preventDefault();
    const newAddress = { id: Date.now(), ...formData };
    setAddresses([...addresses, newAddress]);

    // Reset form
    setFormData({ city: "", street: "", building: "", label: "Home" });
    setShowForm(false);
    onSelectAddress(newAddress); // Auto-select newly added address
  };

  // Delete address and unselect if necessary
  const deleteAddress = (id) => {
    setAddresses(addresses.filter((a) => a.id !== id));
    if (selectedAddress?.id === id) onSelectAddress(null); // Clear selected
  };

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold"><span style={{ color: "#dc3545" }}>📍</span> Delivery Address</h5>
        <button className="btn btn-sm btn-outline-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add New Address"}
        </button>
      </div>

      {/* ADDRESS CREATION FORM */}
      {showForm && (
        <div className="card mb-3 border-primary p-3 shadow-sm" style={{ borderRadius: "15px" }}>
          <form onSubmit={saveAddress}>

            {/* Address Label Selector */}
            <div className="mb-2">
              <label className="form-label small text-muted">Label</label>
              <select
                className="form-select"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              >
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
              </select>
            </div>

            {/* City + Building */}
            <div className="row g-2 mb-2">
              <div className="col-6">
                <label className="form-label small text-muted">City</label>
                <input
                  required
                  className="form-control"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label small text-muted">Building</label>
                <input
                  required
                  className="form-control"
                  value={formData.building}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                />
              </div>
            </div>

            {/* Street */}
            <div className="mb-2">
              <label className="form-label small text-muted">Street</label>
              <input
                required
                className="form-control"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>

            <button className="btn btn-primary w-100 mt-2" type="submit">Save Address</button>
          </form>
        </div>
      )}

      {/* ADDRESS LIST */}
      {addresses.map((addr) => (
        <div
          key={addr.id}
          className={`card mb-2 p-3 ${selectedAddress?.id === addr.id ? "border-primary bg-light" : "border-0 shadow-sm"}`}
          style={{ borderRadius: "10px", cursor: "pointer" }}
          onClick={() => onSelectAddress(addr)} // Select address when clicked
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{addr.label}</strong><br />
              <small className="text-muted">{addr.city}, {addr.street}, {addr.building}</small>
            </div>

            {/* Delete Button */}
            <button
              className="btn btn-sm btn-outline-danger border-0"
              onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {/* NO ADDRESSES MESSAGE */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center text-muted py-4 border rounded bg-light">
          <p className="mb-0">No addresses saved yet.</p>
        </div>
      )}
    </div>
  );
};

// ==================== CHECKOUT PAGE ====================
export const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext); // Global cart access

  const [selectedAddress, setSelectedAddress] = useState(null); // Which address user selects
  const [paymentMethod, setPaymentMethod] = useState("cash"); // Payment selection
  const [isProcessing, setIsProcessing] = useState(false); // Button loading state

  const navigate = useNavigate();

  // Handle placing an order
  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      alert("Please select an address!");
      return;
    }

    setIsProcessing(true); // Simulate processing
    setTimeout(() => {
      clearCart(); // Empty cart
      setIsProcessing(false);
      alert("Order placed successfully!");
      navigate("/"); // Go home
    }, 1500);
  };

  // Prevent checkout with empty cart
  if (cartItems.length === 0) return <EmptyCart />;

  return (
    <div className="container my-5">

      {/* Back button */}
      <button
        onClick={() => navigate("/cart")}
        className="btn btn-link text-decoration-none mb-3 ps-0"
        style={{ color: "#FF4B2B" }}
      >
        ← Back to Cart
      </button>

      <h2 className="mb-4 fw-bold">Checkout</h2>

      <div className="row g-5">

        {/* LEFT: Addresses + Payment */}
        <div className="col-lg-7">
          <AddressManager selectedAddress={selectedAddress} onSelectAddress={setSelectedAddress} />

          {/* PAYMENT METHOD */}
          <div className="card p-4 shadow-sm border-0 mb-4" style={{ borderRadius: "15px" }}>
            <h5 className="fw-bold mb-3">Payment Method</h5>

            {/* Cash Option */}
            <div
              className="form-check mb-3 p-3 border rounded"
              onClick={() => setPaymentMethod("cash")}
              style={{ cursor: "pointer", borderColor: paymentMethod === "cash" ? "#FF4B2B" : "#dee2e6" }}
            >
              <input className="form-check-input" type="radio" checked={paymentMethod === "cash"} readOnly />
              <label className="form-check-label ms-2 fw-bold">Cash on Delivery 💵</label>
            </div>

            {/* Card Option */}
            <div
              className="form-check p-3 border rounded"
              onClick={() => setPaymentMethod("card")}
              style={{ cursor: "pointer", borderColor: paymentMethod === "card" ? "#FF4B2B" : "#dee2e6" }}
            >
              <input className="form-check-input" type="radio" checked={paymentMethod === "card"} readOnly />
              <label className="form-check-label ms-2 fw-bold">Credit/Debit Card 💳</label>
            </div>
          </div>
        </div>

        {/* RIGHT: Order Summary */}
        <div className="col-lg-5">
          <div className="card p-4 border-0 shadow-sm sticky-top" style={{ borderRadius: "15px", top: "20px", backgroundColor: "#f8f9fa" }}>
            <h5 className="fw-bold mb-4">Order Summary</h5>

            {/* LIST OF ITEMS */}
            <div className="mb-3" style={{ maxHeight: "300px", overflowY: "auto" }}>
              {cartItems.map((item) => (
                <div key={item.id} className="d-flex align-items-center mb-3 border-bottom pb-3">
                  <img
                    src={getImageUrl(item.image)}
                    style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "8px" }}
                    alt={item.name}
                  />

                  <div className="ms-3 flex-grow-1">
                    <h6 className="mb-0">{item.name}</h6>
                    <small className="text-muted">x {item.quantity}</small>
                  </div>

                  <span className="fw-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* REUSED TOTAL COMPONENT */}
            <OrderTotals cartTotal={cartTotal} />

            {/* PLACE ORDER BUTTON */}
            <button
              className="btn text-white w-100 py-3 fw-bold shadow-sm"
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              style={{ borderRadius: "12px", backgroundColor: "#FF4B2B", border: "none" }}
            >
              {isProcessing ? "Processing..." : `Pay $${(cartTotal + 2.99).toFixed(2)}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

// ==================== CART PAGE ====================
const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useContext(CartContext); // Cart context helpers
  const navigate = useNavigate();

  if (cartItems.length === 0) return <EmptyCart />; // No items → show empty screen

  return (
    <div className="container my-5">
      <h2 className="mb-4 fw-bold">Your Cart ({cartItems.length} items)</h2>

      <div className="row g-4">

        {/* LEFT: Items */}
        <div className="col-lg-8">
          {cartItems.map((item) => (
            <div key={item.id} className="card border-0 shadow-sm mb-3 p-3" style={{ borderRadius: "15px" }}>
              <div className="d-flex align-items-center">

                {/* PRODUCT IMAGE */}
                <img
                  src={getImageUrl(item.image)}
                  style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "12px" }}
                  alt={item.name}
                />

                {/* PRODUCT DETAILS */}
                <div className="ms-3 flex-grow-1">
                  <h5 className="fw-bold mb-1">{item.name}</h5>
                  <p className="text-muted mb-0">${item.price}</p>
                </div>

                {/* QUANTITY CONTROLS */}
                <div className="d-flex align-items-center bg-light rounded-pill p-1 mx-3">
                  <button
                    className="btn btn-sm rounded-circle fw-bold"
                    onClick={() => updateQuantity(item.id, -1)}
                    style={{ width: "32px", height: "32px" }}
                  >-</button>

                  <span className="mx-3 fw-bold">{item.quantity}</span>

                  <button
                    className="btn btn-sm rounded-circle fw-bold"
                    onClick={() => updateQuantity(item.id, 1)}
                    style={{ width: "32px", height: "32px" }}
                  >+</button>
                </div>

                {/* REMOVE BUTTON */}
                <button
                  className="btn btn-outline-danger btn-sm border-0"
                  onClick={() => removeFromCart(item.id)}
                  title="Remove Item"
                >✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Order Summary */}
        <div className="col-lg-4">
          <div className="card p-4 border-0 shadow-sm bg-white" style={{ borderRadius: "15px" }}>
            <h5 className="fw-bold mb-3">Order Summary</h5>

            <OrderTotals cartTotal={cartTotal} />

            <button
              className="btn text-white w-100 py-3 fw-bold shadow"
              onClick={() => navigate("/checkout")}
              style={{ borderRadius: "12px", backgroundColor: "#FF4B2B", border: "none" }}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CartPage;