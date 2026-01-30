import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
// Import icons for UI elements
import { FaMapMarkerAlt, FaShoppingCart, FaUser, FaUtensils, FaChartLine } from 'react-icons/fa';

const Navbar = () => {
  // --- 1. Global State Access ---
  // We use useContext to grab the current user data (to check if they are logged in or an admin)
  const { user } = useContext(AuthContext);
  
  // We grab cart data to display the badge number (items count) and total price
  const { cartItems, cartTotal } = useContext(CartContext);
  
  // Hook to navigate/redirect the user programmatically
  const navigate = useNavigate();

  // --- 2. Logic Helpers ---
  // A simple boolean flag to check if the current user has the 'admin' role
  const isAdmin = user?.role === 'admin';

  return (
    // Bootstrap Navbar: 'sticky-top' keeps it visible while scrolling, 'shadow-sm' adds a subtle depth
    <nav className="navbar navbar-expand-lg sticky-top shadow-sm" style={{ backgroundColor: '#fff', padding: '15px 0' }}>
      <div className="container">
        
        {/* --- SECTION A: LOGO (Left Side) --- */}
        {/* Logic: If admin, clicking logo goes to Dashboard. If user, goes to Home. */}
        <Link className="navbar-brand d-flex align-items-center" to={isAdmin ? "/admin" : "/"}>
          <div className="rounded-circle d-flex align-items-center justify-content-center me-2" 
               style={{ width: '40px', height: '40px', background: '#FF4B2B', color: 'white' }}>
            <FaUtensils />
          </div>
          <span className="fw-bold fs-4" style={{ fontFamily: 'Montserrat, sans-serif', color: '#333' }}>
            FoodMarket
          </span>
        </Link>

        {/* --- SECTION B: MOBILE MENU TOGGLE --- */}
        {/* Standard Bootstrap button that appears only on mobile screens to open the menu */}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Collapsible Content Wrapper */}
        <div className="collapse navbar-collapse" id="navbarNav">
          
          {/* --- SECTION C: SEARCH/ADDRESS BAR (Center) --- */}
          {/* CONDITIONAL RENDER: We DO NOT show the delivery address bar to Admins */}
          {!isAdmin && (
            <div className="mx-auto my-3 my-lg-0 d-flex align-items-center" style={{ maxWidth: '500px', width: '100%' }}>
              <div className="input-group shadow-sm rounded-pill overflow-hidden bg-light" style={{ border: '1px solid #eee' }}>
                  <span className="input-group-text border-0 bg-transparent ps-3 text-danger">
                      <FaMapMarkerAlt />
                  </span>
                  <input 
                      type="text" 
                      className="form-control border-0 bg-transparent shadow-none" 
                      placeholder="Enter delivery address" 
                  />
              </div>
            </div>
          )}
          
          {/* Spacer: If user is Admin (no search bar), this empty div ensures the Right Actions stay on the right */}
          {isAdmin && <div className="mx-auto"></div>}

          {/* --- SECTION D: RIGHT ACTIONS (Cart, Profile, Admin Panel) --- */}
          <div className="d-flex align-items-center gap-3">
            
            {/* 1. Cart Button: Only visible to regular Customers (Not Admins) */}
            {!isAdmin && (
              <Link to="/cart" className="btn rounded-pill d-flex align-items-center px-3 fw-bold shadow-sm border-0"
                    style={{ backgroundColor: '#00c9ff', color: 'white' }}>
                <FaShoppingCart className="me-2" />
                {/* Displays live data from CartContext */}
                <span>{cartItems.length} items • ${cartTotal.toFixed(2)}</span>
              </Link>
            )}

            {/* 2. Admin Dashboard Button: Only visible to Admins */}
            {isAdmin && (
               <Link to="/admin" className="btn rounded-pill d-flex align-items-center px-3 fw-bold shadow-sm border-0"
                    style={{ backgroundColor: '#333', color: 'white' }}>
                <FaChartLine className="me-2" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* 3. Auth Button: Switches between "Profile" and "Sign In" */}
            {user ? (
              // CASE: User is Logged In -> Show Profile Circle
              <button 
                  className="btn btn-light rounded-circle shadow-sm border d-flex align-items-center justify-content-center"
                  style={{ width: '45px', height: '45px' }}
                  onClick={() => navigate('/profile')}
                  title="Profile"
              >
                  <FaUser className="text-secondary" />
              </button>
            ) : (
              // CASE: User is Logged Out -> Show "Sign In" Button
              <Link to="/login" className="btn rounded-pill px-4 fw-bold shadow-sm border-0 d-flex align-items-center"
                    style={{ backgroundColor: '#FF4B2B', color: 'white' }}>
                <FaUser className="me-2" />
                Sign In
              </Link>
            )}
            
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;