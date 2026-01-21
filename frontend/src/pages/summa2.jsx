import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';

const Dashboard = ({ isDarkMode = true, onNavigate }) => {
  // API Configuration
  const API_BASE_URL = 'https://restaurant-vayupos.onrender.com/api/v1';
  const [authToken, setAuthToken] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  // View state
  const [showAllOrders, setShowAllOrders] = useState(false);
  
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Loading states
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form states
  const [newCustomer, setNewCustomer] = useState({ 
    first_name: '', 
    last_name: '',
    phone: '', 
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'India'
  });
  const [newOffer, setNewOffer] = useState({ 
    code: '', 
    discount_type: 'percentage', 
    discount_value: '', 
    min_order_amount: 0,
    max_uses: 0,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    description: '' 
  });
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    role: 'Cashier', 
    salary: '', 
    joined: new Date().toISOString().split('T')[0],
    phone: '',
    aadhar: ''
  });
  const [newExpense, setNewExpense] = useState({ 
    title: '', 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    category: 'Supplies',
    subtitle: 'Manual entry',
    type: 'manual',
    account: 'Cashbook',
    tax: 0,
    payment_mode: 'Cash',
    notes: ''
  });

  // Data states
  const [recentOrders, setRecentOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    today_sales: 0,
    total_orders: 0,
    avg_ticket: 0,
    total_expenses: 0
  });

  const activities = [
    { action: 'Staff login', time: 'just now' },
    { action: 'Menu updated', time: '20m ago' },
    { action: 'Expense added', time: '1h ago' }
  ];

  // API Helper Functions
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` })
  });

  const handleApiError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    if (error.message.includes('401') || error.message.includes('403')) {
      alert('Session expired or unauthorized. Please login again.');
      setAuthToken('');
      setShowLoginModal(true);
    } else {
      console.error(`Error in ${context}: ${error.message}`);
    }
  };

  // Login Function
  const handleLogin = async () => {
    if (!credentials.username || !credentials.password) {
      alert('Please enter username and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      if (!response.ok) {
        throw new Error('Login failed. Please check your credentials.');
      }

      const data = await response.json();
      const token = data.access_token || data.token;
      
      if (token) {
        setAuthToken(token);
        setShowLoginModal(false);
        setCredentials({ username: '', password: '' });
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Skip Login (Demo Mode)
  const handleSkipLogin = () => {
    setShowLoginModal(false);
    // Load mock data instead
    loadMockData();
  };

  const loadMockData = () => {
    setDailyStats({
      today_sales: 12450,
      total_orders: 24,
      avg_ticket: 518,
      total_expenses: 3200
    });
    
    setRecentOrders([
      { id: '#1256', type: 'Dine-In', time: '5m ago', amount: 850 },
      { id: '#1255', type: 'Takeaway', time: '15m ago', amount: 420 },
      { id: '#1254', type: 'Delivery', time: '32m ago', amount: 1200 }
    ]);

    setCustomers([
      { name: 'John Doe', phone: '+91 9876543210', email: 'john@example.com', orders: 15 },
      { name: 'Jane Smith', phone: '+91 9876543211', email: 'jane@example.com', orders: 8 }
    ]);

    setOffers([
      { code: 'SAVE10', type: 'Percentage', value: '10%', category: 'All items', id: 1, is_active: true },
      { code: 'FLAT50', type: 'Flat', value: '₹50', category: 'Min ₹500', id: 2, is_active: true }
    ]);

    setStaff([
      { name: 'Raj Kumar', role: 'Chef', payscale: '₹25,000', joined: '01 Jan, 2024', id: 1 },
      { name: 'Priya Singh', role: 'Cashier', payscale: '₹18,000', joined: '15 Feb, 2024', id: 2 }
    ]);

    setExpenses([
      { title: 'Vegetables', amount: '₹ 1,200', date: '20 Jan, 2026', source: 'Manual', id: 1 },
      { title: 'Electricity Bill', amount: '₹ 2,000', date: '19 Jan, 2026', source: 'Auto', id: 2 }
    ]);
  };

  // Fetch Functions
  const fetchDailyStats = async () => {
    if (!authToken) return;
    
    setIsLoadingStats(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${API_BASE_URL}/reports/daily-summary?date=${today}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch daily stats');
      const data = await response.json();
      setDailyStats({
        today_sales: data.total_sales || 0,
        total_orders: data.total_orders || 0,
        avg_ticket: data.avg_ticket || 0,
        total_expenses: data.total_expenses || 0
      });
    } catch (error) {
      handleApiError(error, 'fetchDailyStats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchOrders = async () => {
    if (!authToken) return;
    
    setIsLoadingOrders(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders?skip=0&limit=10`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      
      const ordersArray = data.data || data || [];
      const transformedOrders = ordersArray.map((order, index) => ({
        id: order.order_number || order.id || (1256 - index),
        type: order.order_type || 'Dine-In',
        time: formatTime(order.created_at),
        amount: order.total || order.total_amount || 0
      }));
      setRecentOrders(transformedOrders);
    } catch (error) {
      handleApiError(error, 'fetchOrders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchCustomers = async () => {
    if (!authToken) return;
    
    setIsLoadingCustomers(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers?skip=0&limit=100&is_active=true`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      
      const customersArray = data.data || data || [];
      const transformedCustomers = customersArray.map(customer => ({
        name: `${customer.first_name} ${customer.last_name || ''}`.trim(),
        phone: customer.phone,
        email: customer.email,
        orders: customer.order_count || 0
      }));
      setCustomers(transformedCustomers);
    } catch (error) {
      handleApiError(error, 'fetchCustomers');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const fetchOffers = async () => {
    if (!authToken) return;
    
    setIsLoadingOffers(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/coupons?skip=0&limit=100&active_only=true`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      
      const offersArray = data.data || data || [];
      const transformedOffers = offersArray.map(coupon => ({
        code: coupon.code,
        type: coupon.discount_type === 'percentage' ? 'Percentage' : 'Flat',
        value: coupon.discount_type === 'percentage' 
          ? `${coupon.discount_value}%` 
          : `₹${coupon.discount_value}`,
        category: coupon.description || '',
        id: coupon.id,
        is_active: coupon.is_active
      }));
      setOffers(transformedOffers);
    } catch (error) {
      handleApiError(error, 'fetchOffers');
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const fetchStaff = async () => {
    if (!authToken) return;
    
    setIsLoadingStaff(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/staff?skip=0&limit=100`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch staff');
      const data = await response.json();
      
      const staffArray = data.data || data || [];
      const transformedStaff = staffArray.map(member => ({
        name: member.name,
        role: member.role,
        payscale: `₹${member.salary?.toLocaleString() || 0}`,
        joined: formatDate(member.joined),
        id: member.id,
        phone: member.phone
      }));
      setStaff(transformedStaff);
    } catch (error) {
      handleApiError(error, 'fetchStaff');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const fetchExpenses = async () => {
    if (!authToken) return;
    
    setIsLoadingExpenses(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses?skip=0&limit=100`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      
      const expensesArray = data.data || data || [];
      const transformedExpenses = expensesArray.map(expense => ({
        title: expense.title,
        amount: `₹ ${expense.amount?.toLocaleString() || 0}`,
        date: formatDate(expense.date),
        source: expense.type === 'manual' ? 'Manual' : 'Auto',
        id: expense.id
      }));
      setExpenses(transformedExpenses);
    } catch (error) {
      handleApiError(error, 'fetchExpenses');
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  // Helper functions for date/time formatting
  const formatTime = (datetime) => {
    if (!datetime) return 'N/A';
    const now = new Date();
    const then = new Date(datetime);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Add functions with API integration
  const addCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.phone) {
      alert('Please fill in first name and phone');
      return;
    }

    if (!authToken) {
      alert('Please login first');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCustomer)
      });

      if (!response.ok) throw new Error('Failed to create customer');
      
      alert('Customer added successfully!');
      setNewCustomer({ 
        first_name: '', 
        last_name: '',
        phone: '', 
        email: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'India'
      });
      setShowCustomerModal(false);
      fetchCustomers();
    } catch (error) {
      handleApiError(error, 'addCustomer');
    }
  };

  const addOffer = async () => {
    if (!newOffer.code || !newOffer.discount_value) {
      alert('Please fill in code and value');
      return;
    }

    if (!authToken) {
      alert('Please login first');
      return;
    }

    try {
      const payload = {
        ...newOffer,
        discount_value: parseFloat(newOffer.discount_value)
      };

      const response = await fetch(`${API_BASE_URL}/coupons`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create offer');
      
      alert('Offer created successfully!');
      setNewOffer({ 
        code: '', 
        discount_type: 'percentage', 
        discount_value: '', 
        min_order_amount: 0,
        max_uses: 0,
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: '' 
      });
      setShowOfferModal(false);
      fetchOffers();
    } catch (error) {
      handleApiError(error, 'addOffer');
    }
  };

  const addStaff = async () => {
    if (!newStaff.name || !newStaff.salary) {
      alert('Please fill in name and salary');
      return;
    }

    if (!authToken) {
      alert('Please login first');
      return;
    }

    try {
      const payload = {
        ...newStaff,
        salary: parseFloat(newStaff.salary)
      };

      const response = await fetch(`${API_BASE_URL}/staff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to add staff');
      
      alert('Staff member added successfully!');
      setNewStaff({ 
        name: '', 
        role: 'Cashier', 
        salary: '', 
        joined: new Date().toISOString().split('T')[0],
        phone: '',
        aadhar: ''
      });
      setShowStaffModal(false);
      fetchStaff();
    } catch (error) {
      handleApiError(error, 'addStaff');
    }
  };

  const addExpense = async () => {
    if (!newExpense.title || !newExpense.amount) {
      alert('Please fill in title and amount');
      return;
    }

    if (!authToken) {
      alert('Please login first');
      return;
    }

    try {
      const payload = {
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      };

      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to add expense');
      
      alert('Expense added successfully!');
      setNewExpense({ 
        title: '', 
        amount: '', 
        date: new Date().toISOString().split('T')[0], 
        category: 'Supplies',
        subtitle: 'Manual entry',
        type: 'manual',
        account: 'Cashbook',
        tax: 0,
        payment_mode: 'Cash',
        notes: ''
      });
      setShowExpenseModal(false);
      fetchExpenses();
      fetchDailyStats();
    } catch (error) {
      handleApiError(error, 'addExpense');
    }
  };

  // Load all data on component mount
  useEffect(() => {
    if (authToken) {
      fetchDailyStats();
      fetchOrders();
      fetchCustomers();
      fetchOffers();
      fetchStaff();
      fetchExpenses();
    } else {
      setShowLoginModal(true);
    }
  }, [authToken]);

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

  // Computed values
  const displayedOrders = showAllOrders ? recentOrders : recentOrders.slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground dark:text-card-foreground mb-4">Login Required</h3>
            <p className="text-sm text-muted-foreground mb-4">Please login to access the dashboard or continue in demo mode.</p>
            
            <input 
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-4"
            />
            
            <div className="flex gap-2 mb-3">
              <button 
                onClick={handleLogin} 
                disabled={isLoggingIn}
                className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </div>
            
            <button 
              onClick={handleSkipLogin}
              className="w-full py-2 bg-muted text-foreground rounded-lg hover:bg-secondary"
            >
              Continue in Demo Mode
            </button>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground dark:text-card-foreground mb-4">Add Customer</h3>
            <input 
              type="text"
              placeholder="First name *"
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
              placeholder="+91 Phone number *"
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
            <input 
              type="text"
              placeholder="Address"
              value={newCustomer.address}
              onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="text"
              placeholder="City"
              value={newCustomer.city}
              onChange={(e) => setNewCustomer({...newCustomer, city: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="text"
              placeholder="State"
              value={newCustomer.state}
              onChange={(e) => setNewCustomer({...newCustomer, state: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="text"
              placeholder="ZIP Code"
              value={newCustomer.zip_code}
              onChange={(e) => setNewCustomer({...newCustomer, zip_code: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <div className="flex gap-2">
              <button onClick={addCustomer} className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save</button>
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
              placeholder="Coupon code (e.g. SAVE10) *"
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
              <option value="flat">Flat</option>
            </select>
            <input 
              type="number"
              placeholder="Value (e.g. 10 or 50) *"
              value={newOffer.discount_value}
              onChange={(e) => setNewOffer({...newOffer, discount_value: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="number"
              placeholder="Minimum order amount"
              value={newOffer.min_order_amount}
              onChange={(e) => setNewOffer({...newOffer, min_order_amount: parseFloat(e.target.value) || 0})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="number"
              placeholder="Max uses (0 for unlimited)"
              value={newOffer.max_uses}
              onChange={(e) => setNewOffer({...newOffer, max_uses: parseInt(e.target.value) || 0})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <input 
              type="text"
              placeholder="Description"
              value={newOffer.description}
              onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
              className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
            />
            <div className="flex gap-2">
              <button onClick={addOffer} className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Create</button>
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
              placeholder="Full name *"
              value={newStaff.name}
onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
/>
<input
type="text"
placeholder="Phone number (10 digits) *"
value={newStaff.phone}
onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
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
placeholder="Monthly salary (e.g. 15000) *"
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
<input
type="text"
placeholder="Aadhar number (optional)"
value={newStaff.aadhar}
onChange={(e) => setNewStaff({...newStaff, aadhar: e.target.value})}
className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
/>
<div className="flex gap-2">
<button onClick={addStaff} className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save</button>
<button onClick={() => setShowStaffModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg">Cancel</button>
</div>
</div>
</div>
)}  {/* Expense Modal */}
  {showExpenseModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-foreground dark:text-card-foreground mb-4">Add Expense</h3>
        <input 
          type="text"
          placeholder="Expense title (e.g. Milk purchase) *"
          value={newExpense.title}
          onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
          className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
        />
        <input 
          type="number"
          placeholder="Amount (e.g. 2150) *"
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
        <select 
          value={newExpense.payment_mode}
          onChange={(e) => setNewExpense({...newExpense, payment_mode: e.target.value})}
          className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
        >
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
        <textarea 
          placeholder="Notes (optional)"
          value={newExpense.notes}
          onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
          className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground mb-3"
          rows="2"
        />
        <div className="flex gap-2">
          <button onClick={addExpense} className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save</button>
          <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  )}  {/* Header */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
    <div>
      <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
      {!authToken && (
        <p className="text-sm text-muted-foreground">Demo Mode - Data is not synced</p>
      )}
    </div>
    <div className="flex gap-2">
      {authToken && (
        <button
          onClick={() => {
            fetchDailyStats();
            fetchOrders();
            fetchCustomers();
            fetchOffers();
            fetchStaff();
            fetchExpenses();
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
        >
          Refresh Data
        </button>
      )}
      <button
        onClick={() => {
          setAuthToken('');
          setShowLoginModal(true);
        }}
        className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-secondary text-sm"
      >
        {authToken ? 'Logout' : 'Login'}
      </button>
    </div>
  </div>  {/* Stats Cards */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-muted-foreground text-xs sm:text-sm">Today Sales</p>
        <DollarSign className="text-teal-400" size={18} />
      </div>
      <p className="text-xl sm:text-3xl font-bold text-card-foreground">
        {isLoadingStats ? '...' : `₹${dailyStats.today_sales.toLocaleString()}`}
      </p>
    </div>
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-muted-foreground text-xs sm:text-sm">Orders</p>
        <ShoppingBag className="text-teal-400" size={18} />
      </div>
      <p className="text-xl sm:text-3xl font-bold text-card-foreground">
        {isLoadingStats ? '...' : dailyStats.total_orders}
      </p>
    </div>
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-muted-foreground text-xs sm:text-sm">Avg Ticket</p>
        <TrendingUp className="text-teal-400" size={18} />
      </div>
      <p className="text-xl sm:text-3xl font-bold text-card-foreground">
        {isLoadingStats ? '...' : `₹${dailyStats.avg_ticket.toLocaleString()}`}
      </p>
    </div>
    <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-sm hover:shadow-lg hover:scale-105 rounded-xl p-4 sm:p-6 transition-all duration-300 cursor-pointer">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-muted-foreground text-xs sm:text-sm">Expenses</p>
        <Wallet className="text-teal-400" size={18} />
      </div>
      <p className="text-xl sm:text-3xl font-bold text-card-foreground">
        {isLoadingStats ? '...' : `₹${dailyStats.total_expenses.toLocaleString()}`}
      </p>
    </div>
  </div>  {/* Quick Links, Recent Orders, Activity */}
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
    </div>    {/* Recent Orders */}
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
      {isLoadingOrders ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {displayedOrders.length > 0 ? displayedOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="text-foreground">
                <p className="font-medium text-xs sm:text-sm">{order.id} • {order.type}</p>
                <p className="text-xs text-muted-foreground">{order.time}</p>
              </div>
              <p className="font-semibold text-foreground text-sm sm:text-base">₹ {order.amount}</p>
            </div>
          )) : (
            <p className="text-center text-muted-foreground text-sm">No orders yet</p>
          )}
        </div>
      )}
    </div>    {/* Activity */}
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
  </div>  {/* Customers, Offers */}
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
      {isLoadingCustomers ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2 mb-4">
          {customers.length > 0 ? customers.slice(0, 5).map((cust, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground text-sm sm:text-base">{cust.name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">{cust.phone} • {cust.orders} orders</p>
            </div>
          )) : (
            <p className="text-center text-muted-foreground text-sm">No customers yet</p>
          )}
        </div>
      )}
    </div>    {/* Offers */}
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
      {isLoadingOffers ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          {offers.length > 0 ? offers.map((offer, idx) => (
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
          )) : (
            <p className="text-center text-muted-foreground text-sm">No offers yet</p>
          )}
        </div>
      )}
    </div>
  </div>  {/* Staff, Expenses */}
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
      {isLoadingStaff ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          {staff.length > 0 ? staff.map((member, idx) => (
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
          )) : (
            <p className="text-center text-muted-foreground text-sm">No staff members yet</p>
          )}
        </div>
      )}
    </div>    {/* Expenses */}
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
      {isLoadingExpenses ? (
        <p className="text-center text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-2">
          {expenses.length > 0 ? expenses.slice(0, 5).map((exp, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm text-foreground">{exp.title}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs sm:text-sm text-muted-foreground">{exp.date}</p>
                <p className="font-semibold text-foreground text-sm sm:text-base">{exp.amount}</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-muted-foreground text-sm">No expenses yet</p>
          )}
        </div>
      )}
    </div>
  </div>
</div>
);
};export default Dashboard;