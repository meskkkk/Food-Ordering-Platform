import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
// Importing shared RestaurantCard component so category pages use the same design
import { RestaurantCard } from "./Home";

/*
  ===============================
   CATEGORY PAGE COMPONENT
  ===============================
  This page shows restaurants filtered by a specific category or cuisine.
  The category comes from the URL, using the dynamic route parameter (slug).
*/

const CategoryPage = () => {
  // Get category name from route (e.g., /category/italian → slug = "italian")
  const { slug } = useParams();

  // Stores restaurants returned from backend or dummy data
  const [restaurants, setRestaurants] = useState([]);

  // Loading spinner state
  const [loading, setLoading] = useState(true);

  // State for hover animation on back button
  const [backHover, setBackHover] = useState(false);

  /*
    ----------------------------------------------
    FETCH RESTAURANTS WHEN CATEGORY CHANGES
    ----------------------------------------------
    - Converts slug to lowercase
    - Tries fetching data from backend via /restaurants
    - Filters restaurants based on category or cuisine
    - If API fails or no match found → fallback to dummy data
  */
  useEffect(() => {
    const fetchCategoryRestaurants = async () => {
      setLoading(true);
      const lowerSlug = slug.toLowerCase();

      try {
        // Fetch all restaurants from backend
        const response = await api.get("/restaurants");
        const allData = response.data || [];

        // Filter restaurants based on slug (category or cuisine)
        const filteredApiData = allData.filter((r) => {
          const cat = (r.category || r.cuisine || "").toLowerCase();
          return cat.includes(lowerSlug) || lowerSlug.includes(cat);
        });

        // If backend returns valid matches → use them
        if (filteredApiData.length > 0) {
          setRestaurants(filteredApiData);
        } else {
          // Force fallback if no API restaurant matches the slug
          throw new Error("No matching restaurants in API");
        }
      } catch (err) {
        console.warn(
          "API empty or failed, using dummy data filtering:",
          err.message
        );

        // Fallback to dummy restaurants
        const filteredDummy = dummyRestaurants.filter((r) => {
          const cat = (r.category || r.cuisine || "").toLowerCase();
          return cat.includes(lowerSlug) || lowerSlug.includes(cat);
        });

        setRestaurants(filteredDummy);
      } finally {
        // End the loading state
        setLoading(false);
      }
    };

    // Run when slug changes
    fetchCategoryRestaurants();
  }, [slug]);

  /*
    ===============================
      PAGE RENDER
    ===============================
    Shows:
    - Back button
    - Title (category)
    - Loading spinner
    - No results message
    - Grid of restaurants
  */
  return (
    <div className="container my-5" style={{ minHeight: "60vh" }}>
      {/* Header row with back button */}
      <div className="d-flex align-items-center mb-4">
        <Link
          to="/"
          className="btn rounded-pill d-inline-flex align-items-center text-decoration-none me-3"
          onMouseEnter={() => setBackHover(true)}
          onMouseLeave={() => setBackHover(false)}
          style={{
            padding: "8px 14px",
            backgroundColor: backHover ? "#e43e20" : "#FF4B2B",
            color: "#fff",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            fontSize: "1.125rem",
          }}
        >
          <span className="me-2">←</span>
          <span>Back</span>
        </Link>

        {/* Category title */}
        <h2 className="fw-bold text-capitalize m-0" style={{ fontSize: "1.5rem" }}>
          {slug}
        </h2>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : /* NO RESTAURANTS MATCH CATEGORY */ restaurants.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <h3>No restaurants found 😔</h3>
          <p>We couldn't find any restaurants serving {slug}.</p>

          {/* Button to go back home */}
          <Link
            to="/"
            className="btn rounded-pill d-inline-flex align-items-center text-decoration-none me-3"
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
            style={{
              padding: "8px 14px",
              backgroundColor: backHover ? "#e43e20" : "#FF4B2B",
              color: "#fff",
              border: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              fontSize: "1.125rem",
            }}
          >
            Browse All
          </Link>
        </div>
      ) : (
        // RESTAURANT GRID
        <div className="row g-4">
          {restaurants.map((rest) => (
            <div key={rest.restaurant_id || rest.id} className="col-md-6 col-lg-4">
              <Link
                to={`/restaurant/${rest.restaurant_id || rest.id}`}
                className="text-decoration-none text-dark"
              >
                {/* Re-used card component */}
                <RestaurantCard rest={rest} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;