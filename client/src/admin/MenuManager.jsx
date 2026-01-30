import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ROUTES } from "../config";
import { FaEdit, FaTrash, FaPlus, FaCloudUploadAlt, FaUtensils } from "react-icons/fa";
import { MenuItemCard } from "../components/pages/RestaurantMenu";

const MenuManager = () => {
  // --- 1. Data State ---
  // Stores the list of all restaurants (for the dropdown)
  const [restaurants, setRestaurants] = useState([]);
  // Stores the ID of the restaurant currently being managed
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  // Stores the actual menu items fetched for the selected restaurant
  const [menuItems, setMenuItems] = useState([]);

  // --- 2. Form State ---
  // Controlled inputs for the "Add/Edit Item" form
  const [itemData, setItemData] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    image: "",
    availability: true, 
  });
  
  // Stores the actual File object if a user uploads a new image
  const [selectedFile, setSelectedFile] = useState(null);
  
  // If null, we are in "Add Mode". If set to an ID, we are in "Edit Mode".
  const [editingId, setEditingId] = useState(null);

  // --- 3. Initial Data Fetch ---
  // Runs once on mount to populate the restaurant dropdown
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get(API_ROUTES.GET_RESTAURANTS);
        setRestaurants(res.data);
      } catch (err) {
        console.error("Error loading restaurants:", err);
      }
    };
    fetchRestaurants();
  }, []);

  // --- 4. Dynamic Menu Fetch ---
  // Runs whenever the user selects a different restaurant from the dropdown
  useEffect(() => {
    if (selectedRestaurant) {
      fetchMenu(selectedRestaurant);
    } else {
      setMenuItems([]); // Clear menu if no restaurant selected
    }
  }, [selectedRestaurant]);

  // Helper function to get menu items from backend
  const fetchMenu = async (restaurantId) => {
    try {
      const res = await axios.get(API_ROUTES.GET_MENU(restaurantId));
      setMenuItems(res.data);
    } catch (error) {
      console.error("Error loading menu:", error);
      setMenuItems([]);
    }
  };

  // --- 5. File Input Handler ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Create a temporary local URL to preview the image immediately
      setItemData({ ...itemData, image: URL.createObjectURL(file) });
    }
  };

  // --- 6. Form Submission (Create or Update) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    if (!selectedRestaurant) return alert("Please select a restaurant first.");
    if (!itemData.name || !itemData.price) return alert("Name and Price are required.");

    // Authentication Check
    const token = localStorage.getItem("token");
    if (!token) return alert("You are not authenticated! Please log in.");

    try {
      // Determine URL: Are we updating an existing item or creating a new one?
      const url = editingId
        ? API_ROUTES.UPDATE_MENU_ITEM(editingId)
        : API_ROUTES.ADD_MENU_ITEM();
      
      const method = editingId ? "put" : "post";

      let dataToSend;
      let headers = { "Authorization": `Bearer ${token}` };
      const availabilityVal = itemData.availability ? 1 : 0; // Convert boolean to MySQL tinyint (1/0)

      // LOGIC BRANCH: File Upload vs. JSON
      if (selectedFile) {
        // CASE A: Image included. Must use FormData to send binary files.
        const data = new FormData();
        data.append("name", itemData.name);
        data.append("description", itemData.description);
        data.append("price", itemData.price);
        data.append("category", itemData.category);
        data.append("availability", availabilityVal);
        data.append("restaurant_id", selectedRestaurant);
        data.append("image", selectedFile); // The actual file object
        dataToSend = data;
      } else {
        // CASE B: Text only. Use standard JSON.
        dataToSend = { 
            ...itemData, 
            availability: availabilityVal, 
            restaurant_id: selectedRestaurant 
        };
        headers["Content-Type"] = "application/json";
      }

      // Execute Request
      await axios({ method, url, data: dataToSend, headers });

      // Reset Form and State on Success
      setItemData({ name: "", price: "", description: "", category: "", image: "", availability: true });
      setSelectedFile(null);
      setEditingId(null);
      
      // Refresh the list to show the new/updated item
      fetchMenu(selectedRestaurant);
      alert(editingId ? "Item updated!" : "Item added!");

    } catch (error) {
      console.error("Error saving item:", error);
      // Handle Session Expiry specifically
      if (error.response && error.response.status === 401) {
          alert("Your session has expired. Please Log Out and Log In again.");
      } else {
          alert(`Failed to save item: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // --- 7. Edit Handler ---
  // Populates the form with the data of the item clicked
  const handleEdit = (item) => {
    setItemData({
      name: item.name,
      price: item.price,
      description: item.description || "",
      category: item.category || "",
      image: item.image || "",
      // Ensure availability is treated as a boolean for the switch input
      availability: item.availability === 1 || item.availability === true,
    });
    setEditingId(item.item_id || item.id);
    setSelectedFile(null); // Reset file input (we keep the old image URL unless they upload a new one)
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll up to the form
  };

  // --- 8. Delete Handler ---
  const handleDelete = async (itemId) => {
    if (window.confirm("Delete this menu item?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(API_ROUTES.DELETE_MENU_ITEM(itemId), {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh grid after deletion
        fetchMenu(selectedRestaurant);
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  return (
    <div className="container-fluid p-0">
      
      {/* SECTION A: Restaurant Selector */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h5 className="mb-0 d-flex align-items-center gap-2 text-dark">
            <FaUtensils className="text-secondary" /> Select Restaurant
          </h5>
          <select
            className="form-select w-auto"
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            value={selectedRestaurant}
          >
            <option value="">-- Choose a Restaurant --</option>
            {restaurants.map((r) => (
              <option key={r.restaurant_id || r.id} value={r.restaurant_id || r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONDITIONAL RENDER: Only show Form/Grid if a restaurant is selected */}
      {selectedRestaurant && (
        <>
          {/* SECTION B: Input Form */}
          <div className="card shadow-sm border-0 mb-4 bg-light">
            <div className="card-body p-4">
              <h4 className="card-title mb-4 text-secondary">
                {editingId ? "Edit Menu Item" : "Add New Item"}
              </h4>
              
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  
                  {/* Name Input */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Item Name</label>
                    <input 
                        type="text" 
                        className="form-control"
                        value={itemData.name} 
                        onChange={(e) => setItemData({ ...itemData, name: e.target.value })} 
                        required 
                    />
                  </div>
                  
                  {/* Price Input */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Price ($)</label>
                    <input 
                        type="number" 
                        className="form-control"
                        value={itemData.price} 
                        onChange={(e) => setItemData({ ...itemData, price: e.target.value })} 
                        required 
                    />
                  </div>

                  {/* Category Input */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Category</label>
                    <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. Starters, Drinks"
                        value={itemData.category} 
                        onChange={(e) => setItemData({ ...itemData, category: e.target.value })} 
                    />
                  </div>
                  
                  {/* Availability Toggle Switch */}
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small">Status</label>
                    <div className="form-check form-switch mt-1">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            role="switch"
                            id="availabilitySwitch"
                            checked={itemData.availability} 
                            onChange={(e) => setItemData({ ...itemData, availability: e.target.checked })} 
                        />
                        <label className={`form-check-label fw-bold ${itemData.availability ? 'text-success' : 'text-danger'}`} htmlFor="availabilitySwitch">
                            {itemData.availability ? 'Available' : 'Unavailable (Sold Out)'}
                        </label>
                    </div>
                  </div>

                  {/* Description Textarea */}
                  <div className="col-12">
                    <label className="form-label fw-bold text-muted small">Description</label>
                    <textarea 
                        className="form-control"
                        rows="3"
                        value={itemData.description} 
                        onChange={(e) => setItemData({ ...itemData, description: e.target.value })} 
                    />
                  </div>

                  {/* Image Upload Input */}
                  <div className="col-12">
                    <label className="form-label fw-bold text-muted small">Item Image</label>
                    <div className="d-flex align-items-center gap-3 mb-2">
                        {/* Custom File Button */}
                        <label htmlFor="menu-file-upload" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                            <FaCloudUploadAlt /> Choose File
                        </label>
                        <input id="menu-file-upload" type="file" accept="image/*" onChange={handleFileChange} className="d-none" />
                        
                        {/* File Name Feedback */}
                        <span className="text-muted small fst-italic">
                            {selectedFile ? selectedFile.name : "No file selected"}
                        </span>
                    </div>
                    {/* Fallback/Paste URL Input */}
                    <input 
                        type="text" 
                        className="form-control"
                        placeholder="Or paste Image URL..." 
                        value={itemData.image} 
                        onChange={(e) => setItemData({ ...itemData, image: e.target.value })} 
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="col-12 mt-4 d-flex gap-2">
                    <button type="submit" className={`btn ${editingId ? 'btn-primary' : 'btn-success'} d-flex align-items-center gap-2 px-4`}>
                       {editingId ? "Update Item" : <><FaPlus /> Add Item</>}
                    </button>
                    
                    {/* Cancel Button (Only shown when editing) */}
                    {editingId && (
                      <button 
                        type="button" 
                        className="btn btn-secondary px-4"
                        onClick={() => { setEditingId(null); setItemData({ name: "", price: "", description: "", category: "", image: "", availability: true }); setSelectedFile(null); }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <hr className="my-5 text-muted" />

          {/* SECTION C: Menu Items Grid */}
          <h3 className="mb-4 text-secondary fw-bold">Current Menu ({menuItems.length} items)</h3>
          
          {menuItems.length === 0 ? (
             <div className="alert alert-info text-center" role="alert">No items in this menu yet.</div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {menuItems.map((item) => (
                <div className="col" key={item.item_id || item.id}>
                    {/* We reuse the MenuItemCard for display consistency */}
                    <MenuItemCard item={item}>
                        
                        {/* Overlay Badge for Sold Out items */}
                        <div className="mb-2">
                            {(!item.availability || item.availability === 0) && (
                                <span className="badge bg-danger">Sold Out</span>
                            )}
                        </div>

                        {/* Admin Action Buttons (Edit/Delete) */}
                        <div className="d-flex justify-content-end gap-2 pt-3 mt-auto">
                            <button onClick={() => handleEdit(item)} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                                <FaEdit /> Edit
                            </button>
                            <button onClick={() => handleDelete(item.item_id || item.id)} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
                                <FaTrash /> Delete
                            </button>
                        </div>
                    </MenuItemCard>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MenuManager;