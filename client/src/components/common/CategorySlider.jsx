import React from "react";
import { Link } from "react-router-dom";
import categories from "../data/categories";

/**
 * CategorySlider Component
 * Displays a responsive grid of clickable category cards.
 * Data is pulled from the local '../data/categories' file.
 */
const CategorySlider = () => {
  return (
    <div className="container mb-5">
      {/* Section Title */}
      <h2 className="fw-bold mb-4">Categories</h2>

      <div className="row">
        {/* Data Mapping:
          Iterate through the 'categories' array. 
          For each category object ('cat'), we render a column containing a link and image.
        */}
        {categories.map((cat) => (
          
          /* Bootstrap Grid Configuration:
             - col-6: Occupies 50% width on mobile (2 items per row).
             - col-md-4: Occupies 33% width on tablets (3 items per row).
             - col-lg-2: Occupies 16% width on desktops (6 items per row).
             - mb-4: Adds margin to the bottom to separate rows.
             - key: Unique identifier required by React for list rendering.
          */
          <div key={cat.id} className="col-6 col-md-4 col-lg-2 mb-4">
            
            {/* Dynamic Routing:
               Wraps the card in a React Router Link.
               Constructs the URL dynamically using the category's slug (e.g., /category/pizza).
            */}
            <Link
              to={`/category/${cat.slug}`}
              className="text-decoration-none text-dark"
            >
              
              {/* Card Styling:
                 - bg-white: Sets background to white.
                 - shadow-sm: Adds a subtle shadow for depth.
                 - rounded-4: Adds significant border-radius for rounded corners.
                 - p-4: Adds padding inside the card.
                 - hover-shadow: A custom class (likely in CSS) for hover effects.
              */}
              <div
                className="bg-white shadow-sm rounded-4 p-4 text-center hover-shadow"
                style={{
                  transition: "0.3s", // Smooth animation for hover effects
                  cursor: "pointer",  // Changes cursor to pointer to indicate clickability
                }}
              >
                {/* Category Icon/Image */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  width="60"
                  height="60"
                  className="mb-3" // Margin bottom to separate image from text
                />
                
                {/* Category Name */}
                <h6 className="fw-bold">{cat.name}</h6>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySlider;