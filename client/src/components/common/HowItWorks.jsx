import React from "react";
import "./HowItWorks.css"; // Imports the CSS file we styled previously

const HowItWorks = () => {
  /* Static Data Array:
    Defines the content for each step in the process. 
    Keeping data separate from JSX makes it easier to update text or add steps later.
  */
  const steps = [
    {
      id: 1,
      title: "Choose Location",
      desc: "Enter your delivery address to see restaurants near you",
      icon: "📍",
      color: "#ff3951", 
    },
    {
      id: 2,
      title: "Browse Menu",
      desc: "Explore menus from hundreds of top-rated restaurants",
      icon: "🍽️",
      color: "#00d5ff", 
    },
    {
      id: 3,
      title: "Place Order",
      desc: "Add items to cart and checkout securely",
      icon: "🛒",
      color: "#ff3951",
    },
    {
      id: 4,
      title: "Track Delivery",
      desc: "Get real-time updates and enjoy your meal",
      icon: "🚀",
      color: "#00d5ff",
    },
  ];

  return (
    <div className="how-container">
      {/* Section Header */}
      <h2 className="how-title">How It Works ✨</h2>

      {/* Grid Container: Uses flexbox (defined in CSS) to align items side-by-side */}
      <div className="how-grid">
        
        {/* Data Mapping:
          Iterates through the 'steps' array to create a card for each item.
        */}
        {steps.map((step) => (
          <div className="how-item" key={step.id}>
            
            {/* Icon Circle:
              Uses inline styles (style={{...}}) to apply the specific background color 
              defined in the data object (step.color). This allows different steps 
              to have different colors dynamically.
            */}
            <div
              className="how-icon"
              style={{ backgroundColor: step.color }}
            >
              <span className="emoji">{step.icon}</span>
            </div>

            {/* Step Title: Combines the ID (number) and the Title */}
            <h4 className="how-step-title">{step.id}. {step.title}</h4>
            
            {/* Short description text */}
            <p className="how-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;