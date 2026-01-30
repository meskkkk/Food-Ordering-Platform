import React, { useEffect, useState, useRef } from "react";
// Custom API service for making HTTP requests
import api from "../services/api";
// Router component for internal navigation
import { Link } from "react-router-dom";
// Icon library import
import { FaSearch } from "react-icons/fa";
// Child components imports
import CategorySlider from "../common/CategorySlider";
import HowItWorks from "../common/HowItWorks";
import "./Home.css";

// --- 1. EXPORTED CARD COMPONENT ---
/**
 * RestaurantCard Component
 * Reusable presentational component to display restaurant details.
 * Receives 'rest' data object, 'children' (optional), and custom 'style'.
 */
export const RestaurantCard = ({ rest, children, style }) => {
  // Helper function to resolve image URLs.
  // Handles absolute URLs (http) vs relative paths (served from localhost).
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:3000${imagePath}`;
  };

  return (
    <div
      className="card shadow-lg border-0 h-100"
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        transition: "0.3s",
        display: "flex",
        flexDirection: "column",
        ...style, // Merge custom styles passed via props (e.g., opacity for closed venues)
      }}
    >
      {/* Restaurant Image */}
      <img
        src={getImageUrl(rest.image)}
        alt={rest.name}
        className="card-img-top"
        style={{ height: "220px", objectFit: "cover" }}
      />
      
      {/* Card Content */}
      <div className="card-body d-flex flex-column">
        {/* Header: Name and Status Badge */}
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h4 className="fw-bold mb-1">{rest.name}</h4>
            <p className="text-muted mb-2">{rest.cuisine || rest.category}</p>
          </div>
          {/* Conditional Status Badge (Open/Closed) */}
          {rest.status && (
            <span
              className={`badge ${
                rest.status === "open" ? "bg-success" : "bg-danger"
              }`}
            >
              {rest.status}
            </span>
          )}
        </div>

        {/* Info: Delivery time and operating hours */}
        {rest.delivery_time && (
          <small className="text-muted mb-3">
            <i className="fa fa-clock-o me-1"></i> {rest.delivery_time} mins •{" "}
            {rest.opening_time
              ? `${rest.opening_time} - ${rest.closing_time}`
              : ""}
          </small>
        )}

        {/* Slot for any extra children components (like buttons) */}
        <div className="mt-auto">{children}</div>
      </div>
    </div>
  );
};

// --- 2. MAIN HOME PAGE COMPONENT ---
const Home = () => {
  // --- State Management ---
  const [restaurants, setRestaurants] = useState([]); // Stores fetched restaurant data
  const [loading, setLoading] = useState(true); // UI loading state
  const [error, setError] = useState(null); // Error message handling
  const [searchTerm, setSearchTerm] = useState(""); // Input for search filter
  
  // Ref used to programmatically scroll to the restaurant section
  const restaurantsRef = useRef(null);

  // --- Scroll Handlers ---
  const scrollToRestaurants = () => {
    if (restaurantsRef.current) {
      restaurantsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Side Effects ---
  // Fetch restaurants from API on component mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get("/restaurants");
        setRestaurants(response.data);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError("Failed to load restaurants. Please try again later.");
        setRestaurants([]);
      } finally {
        setLoading(false); // Stop loading spinner regardless of success/fail
      }
    };
    fetchRestaurants();
  }, []);

  // --- Filtering Logic ---
  // Filters restaurants based on name, cuisine, or category (case-insensitive)
  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.cuisine &&
        r.cuisine.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.category &&
        r.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* --- Hero Banner Section --- */}
      <div
        className="bg-dark text-white text-center py-5 mb-4"
        style={{
          // Linear gradient overlay + background image from URL
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div className="container">
          <h1 className="display-3 fw-bold mb-3">Delicious Food Delivered</h1>
          <p className="lead fs-3 mb-4">
            Choose from the best restaurants in town
          </p>
          
          {/* Search Bar Input */}
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div
                className="input-group rounded-pill shadow-lg"
                style={{ border: "none", overflow: "hidden" }}
              >
                <span
                  className="input-group-text bg-white border-0 ps-4 pt-2"
                  style={{ color: "#FF4B2B" }}
                >
                  <FaSearch />
                </span>
                <input
                  type="text"
                  className="form-control form-control-lg border-0"
                  placeholder="Search for restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: "12px 20px" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Feature Badges Section (Icons & Benefits) --- */}
      <div className="container my-5">
        <div className="row text-center">
          {/* Feature 1: Fast Delivery */}
          <div className="col-md-4 mb-4">
            <div className="p-4 rounded-4 shadow bg-white">
              <img
                src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png"
                width="70"
                className="mb-3"
                alt="Fast Delivery"
              />
              <h4 className="fw-bold">Fast Delivery</h4>
              <p className="text-muted">Quick and reliable to your doorstep</p>
            </div>
          </div>

          {/* Feature 2: Fresh Ingredients */}
          <div className="col-md-4 mb-4">
            <div className="p-4 rounded-4 shadow bg-white">
              <img
                src="https://img.icons8.com/?size=100&id=wqMCXXwVnkX2&format=png&color=000000"
                width="70"
                className="mb-3"
                alt="Fresh Ingredients"
              />
              <h4 className="fw-bold">Fresh Ingredients</h4>
              <p className="text-muted">Served with premium quality</p>
            </div>
          </div>

          {/* Feature 3: Top Restaurants */}
          <div className="col-md-4 mb-4">
            <div className="p-4 rounded-4 shadow bg-white">
              <img
                src="https://img.icons8.com/?size=100&id=IpmBA7icutfY&format=png&color=000000"
                width="70"
                className="mb-3"
                alt="Top Restaurants"
              />
              <h4 className="fw-bold">Top Restaurants</h4>
              <p className="text-muted">Only the best places in town</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Category Slider --- */}
      <CategorySlider />

      {/* --- Restaurant Listing Section --- */}
      {/* Attached Ref here for scrolling */}
      <div className="container mb-5" ref={restaurantsRef}>
        <h2 className="fw-bold mb-4">Restaurants</h2>
        
        {loading ? (
          <p className="text-center fs-4">Loading...</p>
        ) : (
          <div className="row">
            {filteredRestaurants.map((rest, idx) => {
              const isAvailable = rest.status === "open"; // Check if restaurant is open

              return (
                <div
                  key={rest.restaurant_id || rest._id || idx}
                  className="col-md-4 mb-4"
                  // Staggered animation delay based on index (0ms, 120ms, 240ms...)
                  style={{ animationDelay: `${idx * 120}ms` }}
                >
                  {isAvailable ? (
                    // CASE 1: Restaurant is OPEN -> Clickable Link
                    <Link
                      to={`/restaurant/${rest.restaurant_id || rest._id}`}
                      className="text-decoration-none text-dark"
                    >
                      <RestaurantCard rest={rest} />
                    </Link>
                  ) : (
                    // CASE 2: Restaurant is CLOSED/BUSY -> Disabled Div
                    <div
                      className="position-relative"
                      style={{ cursor: "not-allowed" }}
                    >
                      {/* Grayscale and Dimmed Card Visuals */}
                      <RestaurantCard
                        rest={rest}
                        style={{ opacity: 0.6, filter: "grayscale(100%)" }}
                      />

                      {/* Centered Status Overlay Badge */}
                      <div
                        className="position-absolute top-50 start-50 translate-middle badge bg-dark fs-5 shadow px-4 py-2"
                        style={{ zIndex: 10, border: "2px solid white" }}
                      >
                        {rest.status === "busy" ? "TEMPORARILY BUSY" : "CLOSED"}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Error Display */}
        {error && <p className="text-danger text-center">{error}</p>}
        
        <HowItWorks />
      </div>

      {/* --- Statistics Section (Red/Blue Gradient) --- */}
      <div
        className="py-5 text-white text-center w-100"
        style={{ background: "linear-gradient(to right, #ff4e50, #1fa2ff)" }}
      >
        <h2 className="fw-bold mb-4">Why Choose FoodMarket? 💯</h2>

        <div className="row justify-content-center mx-0">
          <div className="col-md-3 mb-3">
            <h3 className="fw-bold">500+</h3>
            <p>Restaurant Partners</p>
          </div>
          <div className="col-md-3 mb-3">
            <h3 className="fw-bold">1M+</h3>
            <p>Happy Customers</p>
          </div>
          <div className="col-md-3 mb-3">
            <h3 className="fw-bold">5M+</h3>
            <p>Orders Delivered</p>
          </div>
          <div className="col-md-3 mb-3">
            <h3 className="fw-bold">30min</h3>
            <p>Average Delivery</p>
          </div>
        </div>
      </div>

      {/* --- Footer Section --- */}
      <footer className="bg-light py-5" style={{ color: "#333" }}>
        <div className="container-fluid px-5">
          <div className="row">
            {/* Column 1: Brand and Socials */}
            <div className="col-md-3 mb-3">
              <h5>FoodMarket</h5>
              <p>
                Connecting you with the best local restaurants for fast,
                convenient delivery.
              </p>

              <div className="d-flex gap-2">
                {/* Social Media Placeholders (Facebook, X/Twitter, LinkedIn) */}
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#ff4e50",
                    color: "#fff",
                  }}
                >
                  f
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#1fa2ff",
                    color: "#fff",
                  }}
                >
                  x
                </div>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "linear-gradient(to right, #ff4e50, #1fa2ff)",
                    color: "#fff",
                  }}
                >
                  in
                </div>
              </div>
            </div>

            {/* Column 2: Customer Links */}
            <div className="col-md-3 mb-3">
              <h5>For Customers</h5>
              <ul className="list-unstyled">
                <li>
                  <a
                    href="#restaurants"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToRestaurants();
                    }}
                    className="text-decoration-none text-dark"
                    style={{ cursor: "pointer" }}
                  >
                    Browse Restaurants
                  </a>
                </li>
                <li>
                  <Link
                    to="/order-history"
                    className="text-decoration-none text-dark"
                  >
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="text-decoration-none text-dark"
                  >
                    My Account
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Restaurant Links */}
            <div className="col-md-3 mb-3">
              <h5>For Restaurants</h5>
              <ul className="list-unstyled">
                <li>
                  <Link to="/admin" className="text-decoration-none text-dark">
                    Restaurant Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Company Links */}
            <div className="col-md-3 mb-3">
              <h5>Company</h5>
              <ul className="list-unstyled">
                <li>
                  <a
                    href="#top"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToTop();
                    }}
                    className="text-decoration-none text-dark"
                    style={{ cursor: "pointer" }}
                  >
                    Home
                  </a>
                </li>
                <li>
                  <Link to="/cart" className="text-decoration-none text-dark">
                    Cart
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <hr />

          <div className="text-center py-3">
            © 2024 FoodMarket. All rights reserved. | Privacy Policy | Terms of
            Service | Cookie Policy
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;