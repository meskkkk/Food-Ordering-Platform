import axios from 'axios';

// --- AXIOS INSTANCE CONFIGURATION ---
// Create a centralized axios instance to handle all API requests.
// This prevents repeating configuration (like baseURL) in every component.
const api = axios.create({
  baseURL: 'http://localhost:3000', 
});

// --- REQUEST INTERCEPTOR ---
// This runs *before* every request is sent to the server.
// Useful for:
// 1. Debugging (logging outgoing requests)
// 2. Authentication (attaching JWT tokens automatically)
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (where your AuthContext stores it)
    const token = localStorage.getItem('token');
    
    // Debug logging to verify what is being sent
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      fullURL: config.baseURL + config.url
    });
    
    // If a token exists, inject it into the Authorization header
    // Format: "Bearer <token>" (Standard JWT authentication scheme)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token attached to request');
    } else {
      console.log('No token found for request');
    }
    
    return config;
  },
  (error) => {
    // Handle errors that happen *before* the request is sent
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
// This runs *after* a response is received from the server.
// Useful for:
// 1. Debugging (logging incoming responses)
// 2. Global Error Handling (like auto-logout on 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    // Successful response (Status 2xx)
    console.log(' API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    // Error response (Status outside 2xx, network error, etc.)
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Auto logout logic:
    // If the server returns 401 (Unauthorized), it usually means the token is invalid or expired.
    // We clear the token and force the user back to the login page.
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;