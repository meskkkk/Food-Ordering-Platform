import React, { useState } from 'react';
import { FaBars, FaTimes, FaUtensils, FaClipboardList, FaChartLine } from 'react-icons/fa';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  // --- State Management ---
  // Controls whether the sidebar is expanded (true) or collapsed (false)
  const [isOpen, setIsOpen] = useState(true);

  // Toggles the state between open and closed
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // --- Styling Helpers ---
  // "DRY" (Don't Repeat Yourself) principle:
  // We define common classes here so we don't have to copy-paste them for every button.
  const baseBtnClass = "btn border-0 w-100 text-start d-flex align-items-center p-3 mb-2 rounded-3 transition-all";
  
  // Visual styles for the currently selected tab (Red background)
  const activeStyle = { backgroundColor: '#ff6b6b', color: 'white', boxShadow: '0 2px 4px rgba(255, 107, 107, 0.3)' };
  
  // Visual styles for unselected tabs (Transparent/Gray)
  const inactiveStyle = { backgroundColor: 'transparent', color: '#555' };

  return (
    <div 
      className="bg-white shadow h-100 d-flex flex-column overflow-hidden sticky-top"
      style={{ 
        // Dynamic Width: Changes based on 'isOpen' state (250px vs 70px)
        width: isOpen ? '250px' : '70px',
        // Transition: Makes the width change animate smoothly
        transition: 'width 0.3s ease', 
        zIndex: 1000
      }}
    >
      {/* --- Section 1: Header & Toggle Button --- */}
      <div 
        className={`d-flex align-items-center mb-3 ${isOpen ? 'justify-content-start' : 'justify-content-center'}`}
        style={{ height: '40px', padding: '0 10px', marginTop: '20px' }}
      >
        {/* Hamburger/Close Button */}
        <button 
          onClick={toggleSidebar} 
          className="btn border-0 p-1 text-dark d-flex align-items-center justify-content-center"
          style={{ minWidth: '30px', fontSize: '20px' }}
          title="Toggle Sidebar"
        >
          {/* Conditional Icon: Show 'X' if open, 'Bars' if closed */}
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        {/* Sidebar Title - Only visible when fully expanded */}
        {isOpen && (
          <h2 className="m-0 fw-bold text-center flex-grow-1 text-dark" style={{ fontSize: '20px', paddingRight: '30px' }}>
            Admin
          </h2>
        )}
      </div>

      <hr className="text-secondary mx-3 my-2" />
      
      {/* --- Section 2: Navigation Menu --- */}
      <div className="px-2">
        
        {/* Button 1: Restaurants */}
        <button 
          // Apply bold font if this is the active tab
          className={`${baseBtnClass} ${activeTab === 'restaurants' ? 'fw-bold' : ''}`}
          // Apply coloring based on active state
          style={activeTab === 'restaurants' ? activeStyle : inactiveStyle}
          // On Click: Update the parent component's state to show 'restaurants' content
          onClick={() => setActiveTab('restaurants')}
          title="Manage Restaurants"
        >
          <FaUtensils style={{ fontSize: '18px', minWidth: '20px', marginRight: isOpen ? '15px' : '0' }} />
          {/* Text Label: Only visible when sidebar is open */}
          {isOpen && <span>Restaurants</span>}
        </button>

        {/* Button 2: Menu Items */}
        <button 
          className={`${baseBtnClass} ${activeTab === 'menu' ? 'fw-bold' : ''}`}
          style={activeTab === 'menu' ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab('menu')}
          title="Manage Menu"
        >
          <FaClipboardList style={{ fontSize: '18px', minWidth: '20px', marginRight: isOpen ? '15px' : '0' }} />
          {isOpen && <span>Menu Items</span>}
        </button>

        {/* Button 3: Sales Orders */}
        <button 
          className={`${baseBtnClass} ${activeTab === 'sales' ? 'fw-bold' : ''}`}
          style={activeTab === 'sales' ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab('sales')}
          title="Sales Orders"
        >
          <FaChartLine style={{ fontSize: '18px', minWidth: '20px', marginRight: isOpen ? '15px' : '0' }} />
          {isOpen && <span>Sales Orders</span>}
        </button>

      </div>
    </div>
  );
};

export default AdminSidebar;