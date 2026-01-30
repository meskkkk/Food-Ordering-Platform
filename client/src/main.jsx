import 'bootstrap/dist/css/bootstrap.min.css'; 
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Find the HTML element with id 'root' and mount the React app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)