import React, { useState } from "react";
import RestaurantManager from "/src/admin/RestaurantManager";
import AdminSidebar from "/src/admin/AdminSidebar"; 
import MenuManager from "/src/admin/MenuManager";
import SalesOrders from "/src/admin/SalesOrders";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("restaurants");

  return (
    <div 
      className="d-flex min-vh-100 w-100" 
      style={{ 
        backgroundColor: "#f4f7f6", 
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
      }}
    >
      {/* Sidebar container - sticky positioned */}
      <div className="sticky-top vh-100 overflow-auto flex-shrink-0" style={{ zIndex: 100 }}>
        <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Main content area */}
      <div className="flex-grow-1 p-4 p-md-5">
        {/* Page header with decorative underline */}
        <div className="position-relative mb-4 pb-2">
          <h1 className="fw-bold text-dark m-0" style={{ fontSize: "28px", color: "#2c3e50" }}>
            Dashboard
          </h1>
          {/* Gradient underline element */}
          <div 
            className="position-absolute start-0 bottom-0 rounded-pill"
            style={{
              width: "60px",
              height: "4px",
              background: "linear-gradient(90deg, #FF4B2B, #FF416C)"
            }}
          ></div>
        </div>

        {/* Content card containing tab components */}
        <div 
          className="bg-white rounded-4 p-4 shadow-sm border"
          style={{ 
            minHeight: "500px", 
            borderColor: "#eaeaea",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
          }}
        >
          {/* Conditional rendering based on active tab */}
          {activeTab === "restaurants" && <RestaurantManager />}
          {activeTab === "menu" && <MenuManager />}
          {activeTab === "sales" && <SalesOrders />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;