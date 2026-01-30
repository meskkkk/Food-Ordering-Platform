import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ROUTES } from '../config'; 
import { 
    FaCalendarDay, 
    FaCalendarAlt, 
    FaChartBar, 
    FaSync, 
    FaMoneyBillWave, 
    FaShoppingBag, 
    FaChartLine
} from 'react-icons/fa';

const SalesOrders = () => {
    // --- 1. STATE MANAGEMENT ---
    
    // Initialize dates to Current Day and Current Month by default
    const today = new Date().toISOString().split('T')[0];     // Format: YYYY-MM-DD
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

    // Filter State
    const [selectedDate, setSelectedDate] = useState(today);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    // Data State
    const [dailySales, setDailySales] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);
    const [orders, setOrders] = useState([]);
    
    // Calculated Stats (derived from the 'orders' array)
    const [stats, setStats] = useState({ revenue: 0, count: 0, avgValue: 0 });

    // UI State
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // --- 2. DATA FETCHING ---
    const fetchAllData = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            // Define Endpoints
            const dailyUrl = API_ROUTES.GET_DAILY_SALES || '/sales/daily';
            const monthlyUrl = API_ROUTES.GET_MONTHLY_SALES || '/sales/monthly';
            const ordersUrl = API_ROUTES.GET_ALL_ORDERS || '/orders';

            // PERFORMANCE: Use Promise.all to fetch all 3 requests in parallel
            // instead of waiting for them one by one. This makes the dashboard load faster.
            const [dailyRes, monthlyRes, ordersRes] = await Promise.all([
                axios.get(dailyUrl, { headers, params: { date: selectedDate } }).catch(err => ({ data: [] })),
                axios.get(monthlyUrl, { headers, params: { month: selectedMonth } }).catch(err => ({ data: [] })),
                axios.get(ordersUrl, { headers }).catch(err => ({ data: [] }))
            ]);

            // Update State
            setDailySales(dailyRes.data || []);
            setMonthlySales(monthlyRes.data || []);

            // Normalize Orders Data (Handle different backend structures)
            let orderData = ordersRes.data;
            if (!Array.isArray(orderData)) {
                if (orderData && Array.isArray(orderData.data)) orderData = orderData.data;
                else orderData = [];
            }
            setOrders(orderData);
            
            // Recalculate Summary Stats based on new data
            calculateStats(orderData);

        } catch (error) {
            console.error("Error fetching data", error);
            setErrorMsg("Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    };

    // Trigger fetch on mount AND whenever the user changes the Date or Month filter
    useEffect(() => {
        fetchAllData();
    }, [selectedDate, selectedMonth]); 

    // --- 3. HELPER FUNCTIONS ---

    // Calculus: Sums up total revenue and calculates averages
    const calculateStats = (data) => {
        if (!Array.isArray(data)) return;
        
        // Sum total amount
        const totalRev = data.reduce((acc, order) => {
            const val = parseFloat(order.total_amount || 0);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
        
        const count = data.length;
        // Avoid division by zero
        const avg = count > 0 ? totalRev / count : 0;
        
        setStats({ revenue: totalRev, count: count, avgValue: avg });
    };

    // Calculus: Sums up quantities of items inside an order
    const calculateTotalItems = (order) => {
        const details = order.order_details || order.items || [];
        if (!Array.isArray(details)) return 0;
        return details.reduce((sum, item) => sum + (parseInt(item.quantity || 0) || 0), 0);
    };

    // UI: Returns a styled badge based on order status
    const getStatusBadge = (status) => {
        const s = status ? String(status).toLowerCase() : 'pending';
        let badgeClass = 'bg-warning text-dark'; // Default: Yellow
        
        if (s === 'delivered' || s === 'completed') badgeClass = 'bg-success'; // Green
        if (s === 'cancelled') badgeClass = 'bg-danger'; // Red
        if (s === 'preparing' || s === 'on the way') badgeClass = 'bg-info text-white'; // Blue
        
        return <span className={`badge rounded-pill ${badgeClass} px-3 py-2 fw-normal`}>{status || 'Pending'}</span>;
    };

    // UI: Format ISO dates to readable text (e.g., "Dec 9, 2025")
    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // UI: Helper to render empty states for tables
    const renderTableRows = (data, type) => {
        if (!data || data.length === 0) {
            return (
                <tr><td colSpan="3" className="text-center text-muted fst-italic">No {type} sales data.</td></tr>
            );
        }
        return data.map((item, index) => (
            <tr key={index}>
                <td className="fw-bold">
                    {/* If daily, show formatted date. If monthly, show YYYY-MM string */}
                    {type === 'daily' ? formatDate(item.day) : item.month}
                </td>
                <td>{item.orders_count}</td>
                <td className="fw-bold text-success">${parseFloat(item.total_sales).toFixed(2)}</td>
            </tr>
        ));
    };

    // --- 4. RENDER ---
    
    // Loading State
    if (loading) return (
        <div className="text-center py-5 text-muted">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <p>Loading sales dashboard...</p>
        </div>
    );

    // Error State
    if (errorMsg) return <div className="alert alert-danger text-center">{errorMsg}</div>;

    return (
        <div className="container-fluid p-0">
            
            {/* --- Header Section --- */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                <h5 className="m-0 text-dark fw-bold"><FaChartBar className="me-2" />Sales Dashboard</h5>
                
                <button 
                    onClick={fetchAllData} 
                    className="btn btn-white border shadow-sm d-flex align-items-center gap-2 text-secondary fw-semibold bg-white"
                >
                    <FaSync /> Refresh
                </button>
            </div>

            {/* --- Summary Stats Cards --- */}
            <div className="row g-4 mb-4">
                {/* Total Revenue */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center">
                            <div className="rounded-3 d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '60px', height: '60px', backgroundColor: '#e3f2fd', color: '#1976d2' }}>
                                <FaMoneyBillWave size={28} />
                            </div>
                            <div>
                                <p className="mb-0 text-muted small fw-bold">Total Revenue</p>
                                <h3 className="mb-0 fw-bold text-dark">${stats.revenue.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Orders */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center">
                            <div className="rounded-3 d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '60px', height: '60px', backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                                <FaShoppingBag size={28} />
                            </div>
                            <div>
                                <p className="mb-0 text-muted small fw-bold">Total Orders</p>
                                <h3 className="mb-0 fw-bold text-dark">{stats.count}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Avg Order Value */}
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body d-flex align-items-center">
                            <div className="rounded-3 d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '60px', height: '60px', backgroundColor: '#fff3e0', color: '#ef6c00' }}>
                                <FaChartLine size={28} />
                            </div>
                            <div>
                                <p className="mb-0 text-muted small fw-bold">Avg. Order Value</p>
                                <h3 className="mb-0 fw-bold text-dark">${stats.avgValue.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Analytics Tables (Daily & Monthly) --- */}
            <div className="row g-4 mb-4">
                
                {/* Daily Sales Table */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                            <h6 className="m-0 fw-bold text-primary"><FaCalendarDay className="me-2"/>Daily Sales</h6>
                            {/* Date Picker Input */}
                            <input 
                                type="date" 
                                className="form-control form-control-sm w-auto"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                <table className="table table-striped table-hover align-middle mb-0 small">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th className="py-2 ps-3">Date</th>
                                            <th className="py-2">Orders</th>
                                            <th className="py-2">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>{renderTableRows(dailySales, 'daily')}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Sales Table */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                            <h6 className="m-0 fw-bold text-primary"><FaCalendarAlt className="me-2"/>Monthly Sales</h6>
                            {/* Month Picker Input */}
                            <input 
                                type="month" 
                                className="form-control form-control-sm w-auto"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                <table className="table table-striped table-hover align-middle mb-0 small">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th className="py-2 ps-3">Month</th>
                                            <th className="py-2">Orders</th>
                                            <th className="py-2">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody>{renderTableRows(monthlySales, 'monthly')}</tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Recent Orders List --- */}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <h5 className="card-title text-secondary fw-bold mb-4">Recent Orders</h5>
                    
                    {orders.length === 0 ? (
                        <div className="text-center py-3 text-muted fst-italic">No orders found.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="py-3 text-secondary small text-uppercase">Order ID</th>
                                        <th className="py-3 text-secondary small text-uppercase">Customer</th>
                                        <th className="py-3 text-secondary small text-uppercase">Total Items</th>
                                        <th className="py-3 text-secondary small text-uppercase">Date</th>
                                        <th className="py-3 text-secondary small text-uppercase">Status</th>
                                        <th className="py-3 text-secondary small text-uppercase">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, idx) => (
                                        <tr key={order._id || order.order_id || idx}>
                                            <td className="fw-bold text-primary">#{String(order.order_id || '---').slice(-6)}</td>
                                            <td>{order.customerName || 'Guest'}</td>
                                            <td><span className="badge bg-light text-dark border">{calculateTotalItems(order)} Items</span></td>
                                            <td className="text-muted">
                                                {formatDate(order.order_date)}
                                            </td>
                                            <td>{getStatusBadge(order.status)}</td>
                                            <td className="fw-bold text-dark">${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesOrders;