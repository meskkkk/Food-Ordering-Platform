# Web Programming Project - Restaurant Delivery Application

A full-stack web application for managing restaurant orders and deliveries with admin dashboard and user-friendly interfaces.

## Overview

This is a comprehensive restaurant management and delivery platform that allows users to browse restaurants, place orders, track deliveries, and rate their experiences. The application features an admin dashboard for restaurant and menu management, sales tracking, and order oversight.

## Technology Stack

### Frontend

- **React.js** - UI framework
- **React Router** - Client-side routing
- **Context API** - State management (Auth & Cart)
- **CSS** - Styling

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Database** - Database layer (configured in db.js)

## Project Structure

```
Web Project/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── admin/                  # Admin dashboard components
│   │   │   ├── AdminSideBar.jsx
│   │   │   ├── MenuManager.jsx
│   │   │   ├── RestaurantManager.jsx
│   │   │   └── SalesOrders.jsx
│   │   ├── components/
│   │   │   ├── PrivateRoute.jsx    # Route protection
│   │   │   ├── common/             # Shared components
│   │   │   ├── context/            # Context providers
│   │   │   ├── data/               # Static data
│   │   │   ├── pages/              # Page components
│   │   │   └── services/           # API services
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── server/                          # Express backend application
│   ├── src/
│   │   ├── controllers/            # Route controllers
│   │   ├── database/               # Database configuration
│   │   ├── middleware/             # Custom middleware
│   │   ├── routes/                 # API routes
│   │   └── services/               # Business logic services
│   ├── uploads/                    # User uploaded files
│   ├── scripts/                    # Utility scripts
│   ├── server.js                   # Entry point
│   └── package.json
└── package.json                    # Root package.json
```

## Key Features

### User Features

- **Authentication** - User registration and login
- **Restaurant Browsing** - View restaurants and their menus
- **Category Navigation** - Browse products by category
- **Shopping Cart** - Add items and manage cart
- **Order Placement** - Checkout and place orders
- **Order Tracking** - Real-time order status tracking
- **Order History** - View past orders
- **Ratings & Reviews** - Rate and review orders
- **User Profile** - Manage user information

### Admin Features

- **Dashboard** - Overview of all operations
- **Restaurant Management** - Add, edit, and manage restaurants
- **Menu Management** - Manage restaurant menus and items
- **Sales Orders** - View and manage orders
- **Order Status Management** - Track and update order statuses
- **Sales Analytics** - Monitor sales performance

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Setup

1. **Install Root Dependencies**

   ```bash
   npm install
   ```

2. **Install Client Dependencies**

   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Install Server Dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

## Configuration

### Environment Variables

Create a `.env` file in the `server` directory with the necessary configuration:

```
DATABASE_URL=your_database_connection_string
PORT=5000
NODE_ENV=development
# Add other environment variables as needed
```

## Running the Application

### Development Mode

**Terminal 1 - Start Backend Server:**

```bash
cd server
npm start
```

The server will run on `http://localhost:5000` (or configured PORT)

**Terminal 2 - Start Frontend Development Server:**

```bash
cd client
npm start
```

The client will typically run on `http://localhost:5173` or `http://localhost:3000`

### Production Build

**Build Frontend:**

```bash
cd client
npm run build
```

**Start Backend:**

```bash
cd server
npm start
```

## API Endpoints

The backend provides the following API routes:

- **Authentication** - `/api/auth` - Login, registration, logout
- **Users** - `/api/users` - User profile management
- **Restaurants** - `/api/restaurants` - Restaurant data
- **Orders** - `/api/orders` - Order management and tracking
- **Reviews** - `/api/reviews` - Product and order reviews
- **Locations** - `/api/locations` - Delivery location management
- **Admin** - `/api/admin` - Admin operations
- **Sales** - `/api/sales` - Sales analytics and reports

## Database Migrations

Run any necessary database migrations:

```bash
cd server
npm run migrate
```

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## Project Structure Details

### Frontend Services

- **api.js** - API client for backend communication
- **AuthContext.jsx** - Authentication state management
- **CartContext.jsx** - Shopping cart state management

### Backend Controllers

Handle business logic for different domains:

- `auth.controller.js` - Authentication logic
- `user.controller.js` - User management
- `restaurant.controller.js` - Restaurant operations
- `order.controller.js` - Order processing
- `reviews.controller.js` - Review management
- `sales.controller.js` - Sales analytics

## Support

For issues or questions, please refer to the project documentation or contact the development team.

## License

This project is proprietary and all rights are reserved.

---

**Last Updated:** Decemeber 17, 2026
