import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Wallet, RefreshCw, AlertCircle } from 'lucide-react';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const Dashboard = ({ isDarkMode = true, onNavigate }) => {
  // View state
  const [showAllOrders, setShowAllOrders] = useState(false);
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [newOffer, setNewOffer] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: 0, description: '' });
  const [newStaff, setNewStaff] = useState({ name: '', role: 'Cashier', salary: '', joined: '' });
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', date: '', category: 'Supplies' });

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
        const customersArray = data.data || [];
        
        const transformedCustomers = customersArray.map(customer => ({
          id: customer.id,
          name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
          phone: customer.phone || '',
          orders: customer.total_orders || 0,
          email: customer.email || ''
        }));

        setCustomers(transformedCustomers);
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
        
        const transformedOffers = data.map(offer => ({
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
        
        const transformedStaff = data.map(member => ({
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

        setStaff(transformedStaff);
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
        
        const transformedExpenses = data.map(expense => ({
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

  // Add customer
  const addCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.phone) {
      alert('Please fill in first name and phone');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Customer added successfully!');
        setNewCustomer({ first_name: '', last_name: '', phone: '', email: '' });
        setShowCustomerModal(false);
        fetchCustomers();
      } else {
        const errorData = await response.json();
        alert(`Failed to add customer: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error adding customer:', err);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Add offer/coupon
  const addOffer = async () => {
    if (!newOffer.code || !newOffer.discount_value) {
      alert('Please fill in code and discount value');
      return;
    }

    try {
      const offerData = {
        code: newOffer.code.toUpperCase(),
        discount_type: newOffer.discount_type,
        discount_value: parseFloat(newOffer.discount_value),
        min_order_amount: newOffer.min_order_amount || 0,
        max_uses: 0,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: newOffer.description || ''
      };

      const response = await fetch(`${API_BASE_URL}/coupons/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });

      if (response.ok) {
        alert('Offer created successfully!');
        setNewOffer({ code: '', discount_type: 'percentage', discount_value: '', min_order_amount: 0, description: '' });
        setShowOfferModal(false);
        fetchOffers();
      } else {
        const errorData = await response.json();
        alert(`Failed to create offer: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating offer:', err);
      alert('Failed to create offer. Please try again.');
    }
  };

  // Add staff
  const addStaff = async () => {
    if (!newStaff.name || !newStaff.salary) {
      alert('Please fill in name and salary');
      return;
    }

    try {
      const staffData = {
        name: newStaff.name,
        phone: '0000000000', // Default phone if not provided
        role: newStaff.role,
        salary: parseFloat(newStaff.salary),
        joined: newStaff.joined || new Date().toISOString().split('T')[0],
        aadhar: ''
      };

      const response = await fetch(`${API_BASE_URL}/staff/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      if (response.ok) {
        alert('Staff member added successfully!');
        setNewStaff({ name: '', role: 'Cashier', salary: '', joined: '' });
        setShowStaffModal(false);
        fetchStaff();
      } else {
        const errorData = await response.json();
        alert(`Failed to add staff: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error adding staff:', err);
      alert('Failed to add staff. Please try again.');
    }
  };

  // Add expense
  const addExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      alert('Please fill in title and amount');
      return;
    }

    try {
      const expenseData = {
        title: newExpense.title,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        date: newExpense.date || new Date().toISOString().split('T')[0],
        subtitle: 'Manual entry',
        type: 'manual',
        account: 'Cashbook',
        tax: 0,
        payment_mode: 'Cash',
        notes: ''
      };

      const response = await fetch(`${API_BASE_URL}/expenses/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        alert('Expense added successfully!');
        setNewExpense({ title: '', amount: '', date: '', category: 'Supplies' });
        setShowExpenseModal(false);
        fetchExpenses();
        fetchDailySummary();
      } else {
        const errorData = await response.json();
        alert(`Failed to add expense: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error adding expense:', err);
      alert('Failed to add expense. Please try again.');
    }
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
      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground dark:text-card-foreground mb-4">Add Customer</h3>
            <input 
              type="text"
              placeholder="First name"
              value={newCustomer.first_name}
              onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="text"
              placeholder="Last name"
              value={newCustomer.last_name}
              onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="text"
              placeholder="+91 Phone number"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="email"
              placeholder="example@mail.com"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <div className="flex gap-2">
              <button onClick={addCustomer} className="flex-1 py-2 bg-teal-600 text-white rounded-lg">Save</button>
              <button onClick={() => setShowCustomerModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground dark:text-card-foreground mb-4">Create Offer</h3>
            <input 
              type="text"
              placeholder="Coupon code (e.g. SAVE10)"
              value={newOffer.code}
              onChange={(e) => setNewOffer({...newOffer, code: e.target.value.toUpperCase()})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <select 
              value={newOffer.discount_type}
              onChange={(e) => setNewOffer({...newOffer, discount_type: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Flat Amount</option>
            </select>
            <input 
              type="number"
              placeholder={newOffer.discount_type === 'percentage' ? "Percentage (e.g. 10)" : "Amount (e.g. 50)"}
              value={newOffer.discount_value}
              onChange={(e) => setNewOffer({...newOffer, discount_value: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="number"
              placeholder="Minimum order amount (optional)"
              value={newOffer.min_order_amount}
              onChange={(e) => setNewOffer({...newOffer, min_order_amount: parseFloat(e.target.value) || 0})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="text"
              placeholder="Description (optional)"
              value={newOffer.description}
              onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <div className="flex gap-2">
              <button onClick={addOffer} className="flex-1 py-2 bg-teal-600 text-white rounded-lg">Create</button>
              <button onClick={() => setShowOfferModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground dark:text-card-foreground mb-4">Add Staff</h3>
            <input 
              type="text"
              placeholder="Full name"
              value={newStaff.name}
              onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <select 
              value={newStaff.role}
              onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            >
              <option value="Cashier">Cashier</option>
              <option value="Chef">Chef</option>
              <option value="Waiter">Waiter</option>
              <option value="Manager">Manager</option>
            </select>
            <input 
              type="number"
              placeholder="Monthly salary (e.g. 15000)"
              value={newStaff.salary}
              onChange={(e) => setNewStaff({...newStaff, salary: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="date"
              value={newStaff.joined}
              onChange={(e) => setNewStaff({...newStaff, joined: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <div className="flex gap-2">
              <button onClick={addStaff} className="flex-1 py-2 bg-teal-600 text-white rounded-lg">Save</button>
              <button onClick={() => setShowStaffModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground dark:text-card-foreground mb-4">Add Expense</h3>
            <input 
              type="text"
              placeholder="Expense title (e.g. Milk purchase)"
              value={newExpense.title}
              onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="number"
              placeholder="Amount (e.g. 2150)"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <select 
              value={newExpense.category}
              onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            >
              <option value="Supplies">Supplies</option>
              <option value="Utilities">Utilities</option>
              <option value="Salary">Salary</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            <div className="flex gap-2">
              <button onClick={addExpense} className="flex-1 py-2 bg-teal-600 text-white rounded-lg">Save</button>
              <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300cursor-pointer">
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
          onClick={() => setShowCustomerModal(true)}
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
          onClick={() => setShowOfferModal(true)}
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
                <button 
                  onClick={() => alert(`Offer ${offer.code} disabled`)}
                  className="text-xs text-red-400 hover:text-red-500"
                >
                  Disable
                </button>
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
          onClick={() => setShowStaffModal(true)}
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
                <button 
                  onClick={() => alert(`Edit ${member.name}`)}
                  className="text-xs text-teal-400 hover:text-teal-500"
                >
                  Edit
                </button>
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
          onClick={() => setShowExpenseModal(true)}
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