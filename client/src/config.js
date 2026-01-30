// src/config.js
const BASE_URL = 'http://localhost:3000'; 

export const API_ROUTES = {
  // --- Authentication ---
  LOGIN: `${BASE_URL}/api/auth/login`,
  REGISTER: `${BASE_URL}/api/auth/register`,
  GET_USER_PROFILE: `${BASE_URL}/api/auth/profile`,

  // --- Restaurants ---
  GET_RESTAURANTS: `${BASE_URL}/restaurants`,                 // Public read
  CREATE_RESTAURANT: `${BASE_URL}/admin/create-restaurant`,   // Admin write
  UPDATE_RESTAURANT: (id) => `${BASE_URL}/admin/restaurant/${id}`,
  DELETE_RESTAURANT: (id) => `${BASE_URL}/admin/restaurant/${id}`,

  // --- Menu Items ---
  GET_MENU: (restaurantId) => `${BASE_URL}/restaurants/${restaurantId}/items`, // Public read
  ADD_MENU_ITEM: () => `${BASE_URL}/admin/create-item`,       // Admin write
  UPDATE_MENU_ITEM: (itemId) => `${BASE_URL}/admin/item/${itemId}`,
  DELETE_MENU_ITEM: (itemId) => `${BASE_URL}/admin/item/${itemId}`,

  // --- Admin Dashboard & Analytics ---
  GET_ALL_ORDERS: `${BASE_URL}/orders`,
  GET_DAILY_SALES: `${BASE_URL}/sales/daily`,
  GET_MONTHLY_SALES: `${BASE_URL}/sales/monthly`,
};