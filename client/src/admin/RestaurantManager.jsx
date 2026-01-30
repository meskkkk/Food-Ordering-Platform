import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../config';
// Icons for visual feedback in buttons and labels
import { FaEdit, FaTrash, FaPlus, FaCloudUploadAlt } from 'react-icons/fa';
// Shared component: We reuse the exact same card from the Home page 
// to ensure the Admin sees the restaurant exactly as a user would.
import { RestaurantCard } from '../components/pages/Home';

const RestaurantManager = () => {
  // --- 1. STATE MANAGEMENT ---
  
  // Stores the list of restaurants fetched from the database
  const [restaurants, setRestaurants] = useState([]);
  
  // Form State: 
  // We use a single object to hold all input values. 
  // This makes it easier to reset the form or send data in one go.
  const [formData, setFormData] = useState({ 
    name: '', 
    image: '', 
    phone: '', 
    category: '', 
    delivery_time: '', 
    preparing_time: '', 
    opening_time: '', 
    closing_time: '',
    status: 'open' 
  });
  
  // File State:
  // We keep the File object separate from formData because it's binary data, 
  // not a simple string like the other fields.
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Mode Tracker:
  // If 'editingId' is null, we are creating a NEW restaurant.
  // If it has a value (e.g., 5), we are updating the restaurant with ID 5.
  const [editingId, setEditingId] = useState(null);

  // Static list of categories for the dropdown menu
  const CATEGORIES = ["Pizza", "Burger", "Sushi", "Drinks", "Desserts", "Noodles"];

  // --- 2. LIFECYCLE METHODS ---

  // useEffect runs once when the component mounts.
  // It calls the API to get the current list of restaurants so the table isn't empty.
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Wrapper function to fetch data from the API
  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(API_ROUTES.GET_RESTAURANTS);
      
      // Data Normalization:
      // Some backends return the array directly: [ {...}, {...} ]
      // Others wrap it in an object: { data: [ {...}, {...} ], success: true }
      // We check for both cases to prevent the app from crashing.
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.data || []);
      
      setRestaurants(list);
    } catch (error) {
      console.error("Error fetching restaurants", error);
    }
  };

  // --- 3. EVENT HANDLERS ---

  // Triggered when the user selects an image file from their computer
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Store the actual file object for the API upload later
      setSelectedFile(file);
      
      // 2. UX Improvement: Create a temporary URL representing the file.
      // This allows us to show a "preview" of the image immediately,
      // without waiting for it to be uploaded to the server first.
      setFormData({ ...formData, image: URL.createObjectURL(file) });
    }
  };

  // Triggered when the "Add Restaurant" or "Update Restaurant" button is clicked
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the browser from refreshing the page
    
    // Simple Validation
    if (!formData.name) return alert("Restaurant Name is required!");
    if (!formData.category) return alert("Please select a category!");

    // Security Check: Ensure user is logged in
    const token = localStorage.getItem("token");
    if (!token) return alert("You are not authenticated! Please log in.");

    try {
      // Dynamic API Config:
      // If we are editing, use the UPDATE route and 'PUT' method.
      // If creating, use the CREATE route and 'POST' method.
      const url = editingId ? API_ROUTES.UPDATE_RESTAURANT(editingId) : API_ROUTES.CREATE_RESTAURANT;
      const method = editingId ? 'put' : 'post';
      
      let dataToSend;
      let headers = { 
          "Authorization": `Bearer ${token}` 
      };

      // LOGIC BRANCH: Handling File Uploads
      if (selectedFile) {
        // CASE A: User uploaded an image.
        // We MUST use 'FormData' API to send binary files (multipart/form-data).
        // JSON cannot handle binary file uploads efficiently.
        const data = new FormData();
        data.append('name', formData.name);
        data.append('phone', formData.phone);
        data.append('category', formData.category);
        data.append('delivery_time', formData.delivery_time);
        data.append('preparing_time', formData.preparing_time); 
        data.append('opening_time', formData.opening_time);
        data.append('closing_time', formData.closing_time);
        data.append('status', formData.status);
        data.append('image', selectedFile); 
        dataToSend = data;
        // Note: When sending FormData, the browser automatically sets the 
        // 'Content-Type' to 'multipart/form-data', so we don't set it manually.
      } else {
        // CASE B: Text only (no new image).
        // We can send a standard JSON object.
        dataToSend = formData;
        headers['Content-Type'] = 'application/json';
      }

      // Execute the API Request
      await axios({
        method: method,
        url: url,
        data: dataToSend,
        headers: headers
      });

      // Cleanup: Clear the form fields after a successful save
      setFormData({ 
        name: '', image: '', phone: '', category: '', 
        delivery_time: '', preparing_time: '', 
        opening_time: '', closing_time: '', status: 'open' 
      });
      setSelectedFile(null);
      setEditingId(null); // Return to "Create Mode"
      
      // Refresh the list to show the new/updated data
      fetchRestaurants();
      alert(editingId ? "Restaurant Updated!" : "Restaurant Added!");

    } catch (error) {
      console.error("Error saving restaurant", error);
      // Handle session expiry specifically (401 Unauthorized)
      if (error.response && error.response.status === 401) {
          alert("Session expired. Please log in again.");
      } else {
          alert("Failed to save. Check console for details.");
      }
    }
  };

  // Prepares the form for editing an existing restaurant
  const handleEdit = (rest) => {
    // Populate the state with the data of the restaurant clicked
    setFormData({
      name: rest.name,
      image: rest.image || '',
      phone: rest.phone || '',
      category: rest.category || '',
      delivery_time: rest.delivery_time || '',
      preparing_time: rest.preparing_time || '', 
      opening_time: rest.opening_time || '',
      closing_time: rest.closing_time || '',
      status: rest.status || 'open'
    });
    
    // Set the ID so handleSubmit knows we are updating, not creating
    setEditingId(rest.restaurant_id || rest.id);
    
    // Clear selected file (we keep the old image URL unless they upload a new one)
    setSelectedFile(null);
    
    // Smooth scroll to the top so the user sees the form immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Handles deletion of a restaurant
  const handleDelete = async (id) => {
    // Confirm with user before destructive action
    if (window.confirm("Are you sure you want to delete this restaurant?")) {
      const token = localStorage.getItem("token");
      try {
        await axios.delete(API_ROUTES.DELETE_RESTAURANT(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh the list to remove the deleted item
        fetchRestaurants();
      } catch (error) {
        console.error("Error deleting restaurant", error);
      }
    }
  }

  return (
    <div className="container-fluid p-0">
      
      {/* --- SECTION 1: INPUT FORM --- */}
      <div className="card shadow-sm border-0 mb-4 bg-light">
        <div className="card-body p-4">
          <h4 className="card-title mb-4 text-secondary">
            {editingId ? 'Edit Restaurant' : 'Add New Restaurant'}
          </h4>
          
          <form onSubmit={handleSubmit}>
            
            {/* Row 1: Basic Info (Name & Category) */}
            <div className="row g-3 mb-3">
               <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small">Restaurant Name</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.name} 
                    // Updates only the 'name' field in the state object
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
               </div>

               <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small">Category</label>
                  <select 
                      className="form-select"
                      value={formData.category} 
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                      required
                  >
                      <option value="">-- Select Category --</option>
                      {/* Map through the static categories array to create options */}
                      {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))}
                  </select>
               </div>
            </div>

            {/* Row 2: Contact & Timings (Phone, Prep, Delivery) */}
            <div className="row g-3 mb-3">
               <div className="col-md-4">
                  <label className="form-label fw-bold text-muted small">Phone</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  />
               </div>
               
               {/* Preparing Time */}
               <div className="col-md-4">
                  <label className="form-label fw-bold text-muted small">Prep Time (mins)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="e.g. 15"
                    value={formData.preparing_time} 
                    onChange={(e) => setFormData({ ...formData, preparing_time: e.target.value })} 
                  />
               </div>

               <div className="col-md-4">
                  <label className="form-label fw-bold text-muted small">Delivery Time (mins)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="e.g. 30"
                    value={formData.delivery_time} 
                    onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })} 
                  />
               </div>
            </div>

            {/* Row 3: Operation Hours & Status */}
            <div className="row g-3 mb-3">
               <div className="col-md-4">
                  <label className="form-label fw-bold text-muted small">Opening Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={formData.opening_time} 
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })} 
                  />
               </div>
               <div className="col-md-4">
                  <label className="form-label fw-bold text-muted small">Closing Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={formData.closing_time} 
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })} 
                  />
               </div>
               <div className="col-md-4">
                  <label className="form-label fw-bold text-muted small">Status</label>
                  <select 
                    className="form-select"
                    value={formData.status} 
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="busy">Busy</option>
                  </select>
               </div>
            </div>

            {/* Row 4: Image Upload */}
            <div className="mb-4">
              <label className="form-label fw-bold text-muted small">Restaurant Image</label>
              <div className="d-flex align-items-center gap-3 mb-2">
                  {/* Custom Styled Upload Button */}
                  <label htmlFor="file-upload" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
                      <FaCloudUploadAlt /> Choose File
                  </label>
                  
                  {/* Hidden File Input: We hide the ugly default input and trigger it via the label above */}
                  <input 
                    id="file-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="d-none" 
                  />
                  
                  {/* Show selected file name feedback */}
                  <span className="text-muted small fst-italic">
                      {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>
              </div>
              
              {/* Fallback Input: Allows pasting a direct URL if not uploading a file */}
              <input 
                type="text" 
                className="form-control"
                placeholder="Or paste Image URL..." 
                value={formData.image} 
                onChange={(e) => setFormData({ ...formData, image: e.target.value })} 
              />
            </div>

            {/* Form Action Buttons */}
            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className={`btn ${editingId ? 'btn-primary' : 'btn-success'} d-flex align-items-center gap-2 px-4`}
              >
                {/* Dynamically change button text based on mode */}
                {editingId ? 'Update Restaurant' : <><FaPlus /> Add Restaurant</>}
              </button>
              
              {/* Cancel Button: Only visible when editing to exit "Edit Mode" */}
              {editingId && (
                <button 
                  type="button" 
                  className="btn btn-secondary px-4"
                  onClick={() => { 
                    setEditingId(null); 
                    setFormData({ name: '', image: '', phone: '', category: '', delivery_time: '', preparing_time: '', opening_time: '', closing_time: '', status: 'open' }); 
                    setSelectedFile(null); 
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <hr className="my-5 text-muted" />

      {/* --- SECTION 2: RESTAURANT LIST DISPLAY --- */}
      <h3 className="mb-4 text-secondary fw-bold">Current Restaurants ({restaurants.length})</h3>
      
      {restaurants.length === 0 ? (
        <div className="alert alert-info text-center" role="alert">
            No restaurants found. Add one above!
        </div>
      ) : (
        // Grid Layout: 1 col on mobile, 2 on tablet, 3 on desktop
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {restaurants.map((rest) => (
             <div className="col" key={rest.restaurant_id || rest.id}>
                {/* Reusing Home Card Component for visual consistency across app */}
                <RestaurantCard rest={rest}>
                    
                    {/* Inject Admin Control Buttons into the card footer */}
                    <div className="d-flex justify-content-between border-top pt-3 mt-auto">
                        <button onClick={() => handleEdit(rest)} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                            <FaEdit /> Edit
                        </button>
                        <button onClick={() => handleDelete(rest.restaurant_id || rest.id)} className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
                            <FaTrash /> Remove
                        </button>
                    </div>
                </RestaurantCard>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantManager;