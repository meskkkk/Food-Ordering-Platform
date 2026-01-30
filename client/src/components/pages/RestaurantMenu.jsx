import React, { useEffect, useState, useContext } from "react";
// Hooks for routing and URL parameters
import { useParams } from "react-router-dom";
// Custom API service for backend requests
import api from "../services/api";
// Global state for shopping cart management
import { CartContext } from "../context/CartContext";

// --- INLINE ICONS ---
// These SVG components are defined inline to ensure the UI renders correctly
// without requiring external libraries like 'react-icons' or FontAwesome.

const IconSearch = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-muted"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const IconCart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
);

const IconUtensils = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
    <path d="M7 2v20"></path>
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
  </svg>
);

// --- REUSABLE MENU ITEM CARD ---
/**
 * Displays a single food item.
 * Handles visual states for "Available" vs "Sold Out" items.
 * Accepts a 'children' prop to render the action button (Add to Cart).
 */
export const MenuItemCard = ({ item, children, style }) => {
  if (!item) return null; // Safety check

  // Helper to construct image URLs (handles local vs absolute paths)
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };

  // Check availability safely (handles different data types from backend: 1, true, or "1")
  const isAvailable =
    item.availability === 1 ||
    item.availability === true ||
    item.availability === "1";

  return (
    <div
      className="card h-100 border-0 shadow-sm"
      style={{
        borderRadius: "16px",
        overflow: "hidden",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        backgroundColor: "#fff",
        cursor: "default",
        // Dim the card slightly if item is sold out
        opacity: isAvailable ? 1 : 0.7,
        ...style,
      }}
      // Hover effects: Lift card only if item is available
      onMouseEnter={(e) => {
        if (isAvailable) {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 0.125rem 0.25rem rgba(0,0,0,0.075)";
      }}
    >
      {/* Image Container */}
      <div className="position-relative" style={{ height: "200px" }}>
        <img
          src={getImageUrl(item.image)}
          alt={item.name}
          className="w-100 h-100"
          style={{
            objectFit: "cover",
            // Grayscale filter for sold-out items
            filter: isAvailable ? "none" : "grayscale(100%)",
          }}
        />
        {/* Price Badge (Top Right) */}
        <div className="position-absolute top-0 end-0 m-3">
          <span className="badge bg-white text-dark shadow-sm px-3 py-2 rounded-pill fw-bold border">
            ${item.price}
          </span>
        </div>

        {/* SOLD OUT OVERLAY BADGE */}
        {!isAvailable && (
          <div className="position-absolute top-50 start-50 translate-middle">
            <span className="badge bg-danger shadow px-3 py-2 fs-6">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="card-body d-flex flex-column p-4">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5
            className={`card-title fw-bold mb-0 ${
              isAvailable ? "text-dark" : "text-muted"
            }`}
          >
            {item.name}
          </h5>
        </div>

        {/* Category Badge */}
        {item.category && (
          <div className="mb-3">
            <span className="badge bg-light text-secondary border rounded-pill fw-normal px-3">
              {item.category}
            </span>
          </div>
        )}

        <p
          className="card-text text-muted small flex-grow-1"
          style={{ lineHeight: "1.6" }}
        >
          {item.description || "No description available."}
        </p>

        {/* Action Button Area (Passed via children) */}
        <div className="mt-4 pt-3 border-top">{children}</div>
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---
const RestaurantMenu = () => {
  const { id } = useParams(); // Get Restaurant ID from URL
  
  // --- State Management ---
  const [items, setItems] = useState([]); // Full menu list
  const [restaurantName, setRestaurantName] = useState(""); // Restaurant header info
  const [loading, setLoading] = useState(true); // Loading spinner state
  const [error, setError] = useState(null); // Error message state
  const [searchTerm, setSearchTerm] = useState(""); // Filter input state

  // --- Context ---
  // Access global CartContext to add items
  const cartContext = useContext(CartContext);
  const addToCart = cartContext
    ? cartContext.addToCart
    : () => alert("Cart Error: Context missing");

  // --- Data Fetching ---
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // 1. Fetch menu items for this restaurant
        const res = await api.get(`/restaurants/${id}/items`);
        setItems(res.data || []);
        
        // 2. Fetch specific restaurant details (for the name in the header)
        const resRestaurant = await api.get(`/restaurants/${id}`);
        setRestaurantName(resRestaurant.data.name);
      } catch (err) {
        console.error("Error fetching menu:", err);
        setError("Failed to load menu. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [id]);

  // Loading View
  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );

  // --- Filtering Logic ---
  // Filters menu items based on name OR category matches
  const filteredItems = Array.isArray(items)
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.category &&
            item.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="bg-light min-vh-100">
      {/* 1. Hero Header Section */}
      <div
        className="text-white py-5 mb-5 shadow-sm position-relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #FF4B2B 0%, #992814ff 100%)",
        }}
      >
        <div
          className="container text-center position-relative"
          style={{ zIndex: 2 }}
        >
          <div className="d-inline-block p-3 rounded-circle bg-white bg-opacity-10 mb-3 backdrop-blur">
            <IconUtensils className="text-white" />
          </div>
          <h1 className="display-4 fw-bold mb-2">{restaurantName}</h1>
          <p className="lead text-white-50 mb-0">
            Explore our diverse and delicious menu
          </p>
        </div>
      </div>

      <div className="container pb-5">
        {/* 2. Floating Search Bar */}
        <div
          className="row justify-content-center mb-5 mt-5"
          style={{ marginTop: "-45px" }} // Pulls search bar up into the header area
        >
          <div className="col-md-8 col-lg-6">
            <div className="input-group shadow-lg rounded-pill overflow-hidden bg-white p-1">
              <span className="input-group-text bg-white border-0 ps-4">
                <IconSearch />
              </span>
              <input
                type="text"
                className="form-control border-0 shadow-none ps-2 py-3"
                placeholder="Search for dishes (e.g. Pizza, Sushi)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: "1.1rem" }}
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger text-center shadow-sm rounded-4 border-0 mb-4">
            {error}
          </div>
        )}

        {/* 3. Menu Grid */}
        <div className="row g-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              // LOGIC: Check availability for this specific item inside the loop
              const isAvailable =
                item.availability === 1 ||
                item.availability === true ||
                item.availability === "1";

              return (
                <div
                  key={item.item_id || item.id}
                  className="col-md-6 col-lg-4"
                >
                  <MenuItemCard item={item}>
                    {/* The Action Button passed as children to the Card */}
                    <button
                      disabled={!isAvailable} // Disable if sold out
                      className={`btn w-100 rounded-pill py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm ${
                        !isAvailable ? "btn-secondary" : "btn-primary"
                      }`}
                      style={{
                        transition: "all 0.2s",
                        backgroundColor: isAvailable ? "#00c9ff" : "#6c757d",
                        borderColor: isAvailable ? "#00c9ff" : "#6c757d",
                        cursor: isAvailable ? "pointer" : "not-allowed",
                      }}
                      onClick={() => {
                        if (isAvailable) {
                          // Add item to global cart state
                          addToCart({
                            id: item.item_id || item.id,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            restaurant_id: id,
                            restaurant_name: restaurantName,
                          });
                          alert(`${item.name} added to cart!`);
                        }
                      }}
                    >
                      {/* Button Label Logic */}
                      {isAvailable ? (
                        <>
                          <span style={{ marginRight: "5px" }}>
                            <IconCart />
                          </span>{" "}
                          Add to Cart
                        </>
                      ) : (
                        "Sold Out"
                      )}
                    </button>
                  </MenuItemCard>
                </div>
              );
            })
          ) : (
            // Empty State (Search yields no results)
            <div className="col-12 text-center py-5 text-muted">
              <div className="mb-3 opacity-25">
                <IconUtensils />
              </div>
              <p className="fs-5">No items match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantMenu;