import React, { createContext, useState, useEffect } from "react";

// 1. Create the Context
// This allows any component (Navbar, Cart Page, Product Page) to access cart data.
export const CartContext = createContext();

export const CartProvider = ({ children, userId }) => {

  // 2. Initialize State with Lazy Loading
  // Instead of starting with [], we check localStorage first.
  // We use a function inside useState(() => ...) so this logic only runs once on mount.
  const [cartItems, setCartItems] = useState(() => {
    // If no user is logged in, start with an empty cart
    if (!userId) return [];
    
    // Check if there is a saved cart specifically for this user ID
    // Key format: "cart_user_123" (Prevents users from seeing each other's carts on shared devices)
    const savedCart = localStorage.getItem(`cart_user_${userId}`);
    
    // Parse the JSON string back to an array, or return empty array if nothing found
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 3. Auto-Save Effect
  // Whenever 'cartItems' changes (add/remove) or 'userId' changes, 
  // we save the new state to localStorage immediately.
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(`cart_user_${userId}`, JSON.stringify(cartItems));
  }, [cartItems, userId]);

  // 4. Add to Cart Function
  const addToCart = (product) => {
    // Ensure ID is a number to prevent "1" (string) vs 1 (number) mismatches
    const realId = Number(product.id);
  
    setCartItems((prevItems) => {
      // Check if this product is already in the cart
      const existingItem = prevItems.find((item) => Number(item.id) === realId);
  
      if (existingItem) {
        // CASE: Item exists -> Increment quantity by 1
        // We use .map() to create a new array (immutability) updating only the matching item
        return prevItems.map((item) =>
          Number(item.id) === realId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // CASE: New Item -> Add to array with quantity: 1
        return [...prevItems, { ...product, id: realId, quantity: 1 }];
      }
    });
  };

  // 5. Remove Item Function
  // Filters out the item that matches the provided ID
  const removeFromCart = (id) =>
    setCartItems((prevItems) =>
      prevItems.filter((item) => Number(item.id) !== Number(id))
  );
  
  // 6. Update Quantity Function (+ or -)
  const updateQuantity = (id, amount) =>
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        Number(item.id) === Number(id)
          // Math.max(1, ...) ensures quantity never drops below 1
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );

  // 7. Clear Cart Function
  // Wipes state and removes data from localStorage
  const clearCart = () => {
    setCartItems([]);
    if (userId) localStorage.removeItem(`cart_user_${userId}`);
  };

  // 8. Calculate Total Price
  // Uses .reduce() to sum up (price * quantity) for every item in the cart
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal, // Exposing the calculated total directly
      }}
    >
      {children}
    </CartContext.Provider>
  );
};