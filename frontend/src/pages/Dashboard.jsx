import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

// API Configuration
const API_BASE_URL = 'https://restaurant-vayupos.onrender.com/api/v1';

const Dashboard = ({ isDarkMode = true, onNavigate }) => {
  // View state
  const [showAllOrders, setShowAllOrders] = useState(false);

  // Data states
  const [recentOrders, setRecentOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dailySummary, setDailySummary] = useState({
    todaySales: 0,
    ordersCount: 0,
    avgTicket: 0,
    totalExpenses: 0
  });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activities = [
    { action: 'Staff login', time: 'just now' },
    { action: 'Menu updated', time: '20m ago' },
    { action: 'Expense added', time: '1h ago' }
  ];

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchDailySummary(),
        fetchRecentOrders(),
        fetchCustomers(),
        fetchOffers(),
        fetchStaff(),
        fetchExpenses()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch daily summary
  const fetchDailySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${API_BASE_URL}/reports/daily-summary?date=${today}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDailySummary({
          todaySales: data.total_sales || 0,
          ordersCount: data.orders_count || 0,
          avgTicket: data.average_order_value || 0,
          totalExpenses: data.total_expenses || 0
        });
      }
    } catch (err) {
      console.error('Error fetching daily summary:', err);
    }
  };

  // Fetch recent orders
  const fetchRecentOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders?skip=0&limit=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const ordersArray = data.data || [];
        
        const transformedOrders = ordersArray.map(order => {
          const orderTime = order.created_at 
            ? new Date(order.created_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            : '--:--';
          
          // Calculate time ago
          const timeAgo = getTimeAgo(order.created_at);

          return {
            id: order.order_number || `#${order.id}`,
            type: order.order_type || 'Dine-In',
            time: timeAgo,
            amount: parseFloat(order.total || 0)
          };
        });

        setRecentOrders(transformedOrders);
      }
    } catch (err) {
      console.error('Error fetching recent orders:', err);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers?skip=0&limit=10&is_active=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Customers API Response:', data); // Debug log
        
        // Handle different possible response structures
        let customersArray = [];
        
        if (Array.isArray(data)) {
          customersArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          customersArray = data.data;
        } else if (data.customers && Array.isArray(data.customers)) {
          customersArray = data.customers;
        }
        
        const transformedCustomers = customersArray.map(customer => ({
          id: customer.id,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'No Name',
          phone: customer.phone || '',
          orders: customer.total_orders || 0,
          email: customer.email || ''
        }));

        console.log('Transformed Customers:', transformedCustomers); // Debug log
        setCustomers(transformedCustomers);
      } else {
        console.error('Customers API Error:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  // Fetch offers/coupons
  const fetchOffers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/coupons?skip=0&limit=10&active_only=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Offers API Response:', data); // Debug log
        
        // Handle different possible response structures
        let offersArray = [];
        
        if (Array.isArray(data)) {
          offersArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          offersArray = data.data;
        } else if (data.coupons && Array.isArray(data.coupons)) {
          offersArray = data.coupons;
        }
        
        const transformedOffers = offersArray.map(offer => ({
          id: offer.id,
          code: offer.code,
          type: offer.discount_type === 'percentage' ? 'Percentage' : 'Flat',
          value: offer.discount_type === 'percentage' 
            ? `${offer.discount_value}%` 
            : `₹${offer.discount_value}`,
          category: offer.description || 'General'
        }));

        setOffers(transformedOffers);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  };

  // Fetch staff
  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/staff?skip=0&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Staff API Response:', data); // Debug log
        
        // Handle different possible response structures
        let staffArray = [];
        
        if (Array.isArray(data)) {
          staffArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          staffArray = data.data;
        } else if (data.staff && Array.isArray(data.staff)) {
          staffArray = data.staff;
        }
        
        const transformedStaff = staffArray.map(member => ({
          id: member.id,
          name: member.name,
          role: member.role,
          payscale: `₹${member.salary?.toLocaleString() || 0}`,
          joined: new Date(member.joined).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        }));

        console.log('Transformed Staff:', transformedStaff); // Debug log
        setStaff(transformedStaff);
      } else {
        console.error('Staff API Error:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  // Fetch expenses
  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/?skip=0&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Expenses API Response:', data); // Debug log
        
        // Handle different possible response structures
        let expensesArray = [];
        
        if (Array.isArray(data)) {
          expensesArray = data;
        } else if (data.data && Array.isArray(data.data)) {
          expensesArray = data.data;
        } else if (data.expenses && Array.isArray(data.expenses)) {
          expensesArray = data.expenses;
        }
        
        const transformedExpenses = expensesArray.map(expense => ({
          id: expense.id,
          title: expense.title,
          amount: `₹ ${expense.amount?.toLocaleString() || 0}`,
          date: new Date(expense.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          source: expense.type === 'manual' ? 'Manual' : 'Auto'
        }));

        setExpenses(transformedExpenses);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return '--';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Navigation handlers
  const handleNavigateToPOS = () => {
    if (onNavigate) {
      onNavigate('pos');
    }
  };

  const handleNavigateToMenu = () => {
    if (onNavigate) {
      onNavigate('menu');
    }
  };

  const handleNavigateToReports = () => {
    if (onNavigate) {
      onNavigate('reports');
    }
  };

  const handleNavigateToPastOrders = () => {
    if (onNavigate) {
      onNavigate('past-orders');
    }
  };

  const handleNavigateToCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleNavigateToOffers = () => {
    if (onNavigate) {
      onNavigate('offers');
    }
  };

  const handleNavigateToStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleNavigateToExpenses = () => {
    if (onNavigate) {
      onNavigate('expenses');
    }
  };

  const handleSeeAllOrders = () => {
    handleNavigateToPastOrders();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  // Computed values
  const displayedOrders = showAllOrders ? recentOrders : recentOrders.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchAllData()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Stats Cards - Updated with enhanced hover effects */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-muted-foreground text-xs sm:text-sm">Today Sales</p>
            <DollarSign className="text-teal-400" size={18} />
          </div>
          <p className="text-xl sm:text-3xl font-bold text-card-foreground">₹{dailySummary.todaySales.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-muted-foreground text-xs sm:text-sm">Orders</p>
            <ShoppingBag className="text-teal-400" size={18} />
          </div>
          <p className="text-xl sm:text-3xl font-bold text-card-foreground">{dailySummary.ordersCount}</p>
        </div>
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-muted-foreground text-xs sm:text-sm">Avg Ticket</p>
            <TrendingUp className="text-teal-400" size={18} />
          </div>
          <p className="text-xl sm:text-3xl font-bold text-card-foreground">₹{dailySummary.avgTicket.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-muted-foreground text-xs sm:text-sm">Expenses</p>
            <Wallet className="text-teal-400" size={18} />
          </div>
          <p className="text-xl sm:text-3xl font-bold text-card-foreground">₹{dailySummary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        </div>
      </div>

      {/* Quick Links, Recent Orders, Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Quick Links */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-md rounded-xl p-4 sm:p-6 transition-shadow">
          <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">Quick Links</h3>
          <div className="space-y-3">
            <button 
              onClick={handleNavigateToPOS}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-muted rounded-lg hover:bg-secondary transition text-foreground"
            >
              <div className="text-left">
                <p className="font-medium text-sm sm:text-base">Open POS</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Start billing and print KOT</p>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-teal-600 text-xs sm:text-sm rounded whitespace-nowrap text-white">Open</span>
            </button>
            <button 
              onClick={handleNavigateToMenu}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-muted rounded-lg hover:bg-secondary transition text-foreground"
            >
              <div className="text-left">
                <p className="font-medium text-sm sm:text-base">Manage Menu</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Categories, items and prices</p>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-teal-600 text-xs sm:text-sm rounded whitespace-nowrap text-white">Menu</span>
            </button>
            <button 
              onClick={handleNavigateToReports}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-muted rounded-lg hover:bg-secondary transition text-foreground"
            >
              <div className="text-left">
                <p className="font-medium text-sm sm:text-base">View Reports</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Sales and orders</p>
              </div>
              <span className="px-2 sm:px-3 py-1 bg-teal-600 text-xs sm:text-sm rounded whitespace-nowrap text-white">Reports</span>
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-md rounded-xl p-4 sm:p-6 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Recent Orders</h3>
            <button 
              onClick={handleSeeAllOrders}
              className="text-teal-400 text-xs sm:text-sm hover:underline"
            >
              See all
            </button>
          </div>
          <div className="space-y-3">
            {displayedOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
            ) : (
              displayedOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="text-foreground">
                    <p className="font-medium text-xs sm:text-sm">{order.id} • {order.type}</p>
                    <p className="text-xs text-muted-foreground">{order.time}</p>
                  </div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">₹ {order.amount.toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity - Updated with card design for each activity */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-md rounded-xl p-4 sm:p-6 transition-shadow">
          <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-4">Activity</h3>
          <div className="space-y-3">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-secondary transition-colors">
                <p className="text-foreground text-sm sm:text-base">{activity.action}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{activity.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customers, Offers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Customers */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-md rounded-xl p-4 sm:p-6 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Customers</h3>
            <button 
              onClick={handleNavigateToCustomers}
              className="px-2 sm:px-3 py-1 bg-teal-600 text-white rounded text-xs sm:text-sm hover:bg-teal-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No customers yet</p>
            ) : (
              customers.slice(0, 5).map((cust, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground text-sm sm:text-base">{cust.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{cust.phone} • {cust.orders} orders</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Offers */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-md rounded-xl p-4 sm:p-6 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Offers</h3>
            <button 
              onClick={handleNavigateToOffers}
              className="px-2 sm:px-3 py-1 bg-teal-600 text-white rounded text-xs sm:text-sm hover:bg-teal-700"
            >
              Create
            </button>
          </div>
          <div className="space-y-2">
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active offers</p>
            ) : (
              offers.map((offer, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground text-sm sm:text-base">{offer.code}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{offer.type} • {offer.value} • {offer.category}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Staff, Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Staff */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-md rounded-xl p-4 sm:p-6 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Staff</h3>
            <button 
              onClick={handleNavigateToStaff}
              className="px-2 sm:px-3 py-1 bg-teal-600 text-white rounded text-xs sm:text-sm hover:bg-teal-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {staff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No staff members yet</p>
            ) : (
              staff.map((member, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground text-sm sm:text-base">{member.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{member.role} • {member.payscale}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-md rounded-xl p-4 sm:p-6 transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-card-foreground">Expenses</h3>
            <button 
              onClick={handleNavigateToExpenses}
              className="px-2 sm:px-3 py-1 bg-teal-600 text-white rounded text-xs sm:text-sm hover:bg-teal-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded</p>
            ) : (
              expenses.slice(0, 5).map((exp, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm text-foreground">{exp.title}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">{exp.date}</p>
                    <p className="font-semibold text-foreground text-sm sm:text-base">{exp.amount}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;