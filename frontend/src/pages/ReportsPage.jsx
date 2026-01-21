import React, { useState, useEffect } from 'react';
import { Download, Printer, Calendar, Filter, RotateCw, ChevronDown, AlertCircle } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// API Configuration - Using your actual backend URL
const API_BASE_URL = 'https://restaurant-vayupos.onrender.com/api/v1';

const ReportsPage = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Helper function to get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('access_token') || '';
  };

  const [filters, setFilters] = useState({
    reportType: 'Sales',
    view: 'day',
    outlet: 'All',
    paymentMode: 'All',
    sort: 'Total Desc',
    days: 30,
    dateRange: { start: '2025-01', end: '2025-12' }
  });

  const [keyMetrics, setKeyMetrics] = useState({
    totalSales: '₹0',
    totalOrders: '0',
    totalExpenses: '₹0',
    avgOrderValue: '₹0',
    grossMargin: '0%',
    topCategory: '-'
  });

  const [salesData, setSalesData] = useState([]);
  const [salesChartData, setSalesChartData] = useState([]);
  const [ordersData, setOrdersData] = useState({
    bySource: [],
    byPayment: []
  });
  const [orderDistributionData, setOrderDistributionData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [expensesChartData, setExpensesChartData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);

  const COLORS = ['#14b8a6', '#0d9488', '#0f766e'];

  // Helper function to make authenticated API calls
  const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      }
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      throw new Error('Session expired. Please login again.');
    }

    return response;
  };

  // Fetch Sales Report - FIXED VERSION
  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchWithAuth(
        `${API_BASE_URL}/reports/sales?days=${filters.days}&group_by=${filters.view}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sales API Error:', response.status, errorText);
        throw new Error(`Failed to fetch sales report (${response.status})`);
      }
      
      const data = await response.json();
      console.log('🔍 RAW Sales API Response:', data);
      console.log('🔍 Is Array?', Array.isArray(data));
      console.log('🔍 Data Type:', typeof data);
      if (data && typeof data === 'object') {
        console.log('🔍 Data Keys:', Object.keys(data));
      }
      
      // Handle different response formats - check all possible structures
      let salesArray = [];
      if (Array.isArray(data)) {
        salesArray = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        salesArray = data.data;
      } else if (data && data.results && Array.isArray(data.results)) {
        salesArray = data.results;
      } else if (data && data.items && Array.isArray(data.items)) {
        salesArray = data.items;
      }
      
      console.log('🔍 Extracted Sales Array:', salesArray);
      console.log('🔍 Sales Array Length:', salesArray.length);
      if (salesArray.length > 0) {
        console.log('🔍 First Item Structure:', salesArray[0]);
      }
      
      // Transform the API response to match your UI structure
      if (salesArray && salesArray.length > 0) {
        const transformedData = salesArray.map(item => ({
          period: item.date || item.period || 'Unknown',
          orders: item.order_count || item.orders || 0,
          grossSales: `₹${(item.gross_sales || item.total_sales || 0).toLocaleString('en-IN')}`,
          discounts: `₹${(item.discounts || 0).toLocaleString('en-IN')}`,
          net: `₹${(item.net_sales || (item.total_sales - item.discounts) || 0).toLocaleString('en-IN')}`
        }));
        
        console.log('✅ Transformed Sales Data:', transformedData);
        setSalesData(transformedData);
        
        // Prepare chart data
        const chartData = salesArray.map(item => ({
          month: item.date || item.period || 'Unknown',
          sales: item.gross_sales || item.total_sales || 0,
          net: item.net_sales || ((item.total_sales || 0) - (item.discounts || 0))
        }));
        
        console.log('✅ Sales Chart Data:', chartData);
        setSalesChartData([...chartData]); // Force new array reference

        // Calculate key metrics
        const totalSales = salesArray.reduce((sum, item) => sum + (item.gross_sales || item.total_sales || 0), 0);
        const totalOrders = salesArray.reduce((sum, item) => sum + (item.order_count || item.orders || 0), 0);
        const totalDiscounts = salesArray.reduce((sum, item) => sum + (item.discounts || 0), 0);
        
        console.log('✅ Calculated Metrics - Sales:', totalSales, 'Orders:', totalOrders);
        
        setKeyMetrics(prev => ({
          ...prev,
          totalSales: `₹${totalSales.toLocaleString('en-IN')}`,
          totalOrders: totalOrders.toString(),
          avgOrderValue: `₹${totalOrders > 0 ? Math.round(totalSales / totalOrders).toLocaleString('en-IN') : '0'}`
        }));
      } else {
        console.warn('⚠️ No sales data found in API response');
        setSalesData([]);
        setSalesChartData([]);
      }
    } catch (err) {
      setError(err.message);
      console.error('❌ Error fetching sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payment Methods Report
  const fetchPaymentMethodsReport = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/reports/payment-methods?days=${filters.days}`
      );

      if (!response.ok) {
        console.error('Payment methods API error:', response.status);
        throw new Error('Failed to fetch payment methods report');
      }
      
      const data = await response.json();
      console.log('🔍 Payment methods data:', data);
      
      // Handle different response formats
      const paymentsArray = Array.isArray(data) ? data : 
                           (data.data || data.results || data.items || []);
      
      if (paymentsArray && paymentsArray.length > 0) {
        const totalAmount = paymentsArray.reduce((sum, item) => sum + (item.total_amount || 0), 0);
        const totalCount = paymentsArray.reduce((sum, item) => sum + (item.count || 0), 0);
        
        const transformedData = paymentsArray.map((item, index) => ({
          mode: item.payment_method || item.mode || 'Unknown',
          count: item.count || 0,
          share: `${totalCount > 0 ? ((item.count / totalCount) * 100).toFixed(1) : 0}%`,
          amount: `₹${(item.total_amount || 0).toLocaleString('en-IN')}`,
          rank: index + 1
        }));
        
        console.log('✅ Transformed payment data:', transformedData);
        
        setOrdersData(prev => ({
          ...prev,
          byPayment: transformedData
        }));
      }
    } catch (err) {
      console.error('❌ Error fetching payment methods report:', err);
    }
  };

  // Fetch Orders by Payment Method from /api/v1/orders endpoint - FIXED
  const fetchOrdersBySource = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filters.days);

      const response = await fetchWithAuth(
        `${API_BASE_URL}/orders?limit=1000`
      );

      if (!response.ok) {
        console.error('Orders API error:', response.status);
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      console.log('🔍 RAW Orders API Response:', data);
      console.log('🔍 Orders - Is Array?', Array.isArray(data));
      
      // Handle different response formats
      let ordersArray = [];
      if (Array.isArray(data)) {
        ordersArray = data;
      } else if (data && data.data && Array.isArray(data.data)) {
        ordersArray = data.data;
      } else if (data && data.results && Array.isArray(data.results)) {
        ordersArray = data.results;
      }
      
      console.log('🔍 Extracted Orders Array:', ordersArray.length, 'orders');
      
      if (ordersArray.length > 0) {
        console.log('🔍 First Order Structure:', ordersArray[0]);
        
        // Filter orders within date range
        const filteredOrders = ordersArray.filter(order => {
          const orderDate = new Date(order.created_at || order.order_date);
          return orderDate >= startDate && orderDate <= endDate;
        });

        console.log('🔍 Filtered Orders:', filteredOrders.length);

        // Group by payment method
        const ordersBySource = {};
        let totalRevenue = 0;

        filteredOrders.forEach(order => {
          const source = order.payment_method || 'Unknown';
          const orderTotal = order.total || order.total_amount || order.final_amount || 0;
          
          if (!ordersBySource[source]) {
            ordersBySource[source] = {
              orders: 0,
              revenue: 0
            };
          }
          
          ordersBySource[source].orders += 1;
          ordersBySource[source].revenue += orderTotal;
          totalRevenue += orderTotal;
        });

        const totalOrders = filteredOrders.length;

        console.log('🔍 Orders grouped by payment method:', ordersBySource);

        // Transform to array format
        const sourcesArray = Object.entries(ordersBySource)
          .map(([source, data]) => ({
            source: source.charAt(0).toUpperCase() + source.slice(1),
            orders: data.orders,
            share: `${totalOrders > 0 ? ((data.orders / totalOrders) * 100).toFixed(1) : 0}%`,
            revenue: `₹${data.revenue.toLocaleString('en-IN')}`,
            revenueNum: data.revenue
          }))
          .sort((a, b) => b.orders - a.orders)
          .map((item, index) => ({
            ...item,
            rank: index + 1
          }));

        console.log('✅ Final sources array:', sourcesArray);

        setOrdersData(prev => ({
          ...prev,
          bySource: sourcesArray
        }));

        // Prepare pie chart data
        const pieData = sourcesArray.map(item => ({
          name: item.source,
          value: item.orders
        }));
        
        console.log('✅ Pie Chart Data:', pieData);
        setOrderDistributionData([...pieData]); // Force new array reference
      } else {
        console.warn('⚠️ No orders found or empty array');
        setOrdersData(prev => ({
          ...prev,
          bySource: []
        }));
        setOrderDistributionData([]);
      }
    } catch (err) {
      console.error('❌ Error fetching orders by source:', err);
      setOrdersData(prev => ({
        ...prev,
        bySource: []
      }));
      setOrderDistributionData([]);
    }
  };

  // Fetch Expenses from /api/v1/expenses/ endpoint - FIXED
  const fetchExpensesReport = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filters.days);

      const response = await fetchWithAuth(
        `${API_BASE_URL}/expenses/?limit=1000`
      );

      if (!response.ok) {
        console.error('Expenses API error:', response.status);
        throw new Error('Failed to fetch expenses');
      }
      
      const data = await response.json();
      console.log('🔍 RAW Expenses data:', data);
      
      // Handle different response formats
      const expensesArray = Array.isArray(data) ? data : 
                           (data.data || data.results || data.items || []);
      
      console.log('🔍 Expenses Array Length:', expensesArray.length);
      
      if (expensesArray && expensesArray.length > 0) {
        console.log('🔍 First Expense Structure:', expensesArray[0]);
        
        // Filter expenses within date range
        const filteredExpenses = expensesArray.filter(expense => {
          const expenseDate = new Date(expense.date || expense.created_at);
          return expenseDate >= startDate && expenseDate <= endDate;
        });

        // Group by category
        const expensesByCategory = {};
        let totalExpenses = 0;

        filteredExpenses.forEach(expense => {
          const category = expense.category || 'Other';
          const amount = expense.amount || 0;
          
          if (!expensesByCategory[category]) {
            expensesByCategory[category] = {
              transactions: 0,
              amount: 0
            };
          }
          
          expensesByCategory[category].transactions += 1;
          expensesByCategory[category].amount += amount;
          totalExpenses += amount;
        });

        // Transform to array format
        const expensesArrayTransformed = Object.entries(expensesByCategory)
          .map(([category, data]) => ({
            category: category,
            transactions: data.transactions,
            amount: `₹${data.amount.toLocaleString('en-IN')}`,
            amountNum: data.amount,
            share: `${totalExpenses > 0 ? ((data.amount / totalExpenses) * 100).toFixed(1) : 0}%`
          }))
          .sort((a, b) => b.amountNum - a.amountNum)
          .map((item, index) => ({
            ...item,
            rank: index + 1
          }));

        console.log('✅ Transformed expenses:', expensesArrayTransformed);
        setExpensesData(expensesArrayTransformed);

        // Prepare chart data (top categories)
        const chartData = expensesArrayTransformed.slice(0, 10).map(item => ({
          category: item.category.length > 15 ? item.category.substring(0, 15) + '...' : item.category,
          amount: item.amountNum
        }));
        
        console.log('✅ Expenses Chart Data:', chartData);
        setExpensesChartData([...chartData]); // Force new array reference

        // Update total expenses in key metrics
        setKeyMetrics(prev => ({
          ...prev,
          totalExpenses: `₹${totalExpenses.toLocaleString('en-IN')}`
        }));

        // Calculate gross margin if we have sales data
        const salesAmount = parseFloat(keyMetrics.totalSales.replace(/[₹,]/g, '')) || 0;
        if (salesAmount > 0) {
          const margin = ((salesAmount - totalExpenses) / salesAmount * 100).toFixed(1);
          setKeyMetrics(prev => ({
            ...prev,
            grossMargin: `${margin}%`
          }));
        }
      } else {
        console.warn('⚠️ No expenses data');
        setExpensesData([]);
        setExpensesChartData([]);
      }
    } catch (err) {
      console.error('❌ Error fetching expenses report:', err);
      setExpensesData([]);
      setExpensesChartData([]);
    }
  };

  // Fetch Product Sales Report
  const fetchProductSalesReport = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/reports/products-sales?days=${filters.days}&limit=50`
      );

      if (!response.ok) {
        console.error('Product sales API error:', response.status);
        throw new Error('Failed to fetch product sales report');
      }
      
      const data = await response.json();
      console.log('Product sales data:', data);
      
      const productsArray = Array.isArray(data) ? data : 
                           (data.data || data.results || data.items || []);
      
      if (productsArray && productsArray.length > 0) {
        setProductSalesData(productsArray);
        
        // Get top category if available
        if (productsArray[0].category) {
          setKeyMetrics(prev => ({
            ...prev,
            topCategory: productsArray[0].category
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching product sales report:', err);
    }
  };

  // Fetch Daily Summary (for additional metrics)
  const fetchDailySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetchWithAuth(
        `${API_BASE_URL}/reports/daily-summary?date=${today}`
      );

      if (!response.ok) {
        console.error('Daily summary API error:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('Daily summary data:', data);
      
      if (data && data.gross_margin) {
        setKeyMetrics(prev => ({
          ...prev,
          grossMargin: `${data.gross_margin}%`
        }));
      }
    } catch (err) {
      console.error('Error fetching daily summary:', err);
    }
  };

  // Fetch all reports
  const fetchAllReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchSalesReport(),
        fetchPaymentMethodsReport(),
        fetchOrdersBySource(),
        fetchExpensesReport(),
        fetchProductSalesReport(),
        fetchDailySummary()
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError('No authentication token found. Please login first.');
      return;
    }
    fetchAllReports();
  }, []);

  // Recalculate gross margin when sales or expenses change
  useEffect(() => {
    const salesAmount = parseFloat(keyMetrics.totalSales.replace(/[₹,]/g, '')) || 0;
    const expensesAmount = parseFloat(keyMetrics.totalExpenses.replace(/[₹,]/g, '')) || 0;
    
    if (salesAmount > 0 && expensesAmount > 0) {
      const margin = ((salesAmount - expensesAmount) / salesAmount * 100).toFixed(1);
      setKeyMetrics(prev => ({
        ...prev,
        grossMargin: `${margin}%`
      }));
    }
  }, [keyMetrics.totalSales, keyMetrics.totalExpenses]);

  const handleExportCSV = () => {
    const csv = salesData.map(row => 
      `${row.period},${row.orders},${row.grossSales},${row.discounts},${row.net}`
    ).join('\n');
    const blob = new Blob([`Period,Orders,Gross Sales,Discounts,Net\n${csv}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setFilters({
      reportType: 'Sales',
      view: 'day',
      outlet: 'All',
      paymentMode: 'All',
      sort: 'Total Desc',
      days: 30,
      dateRange: { start: '2025-01', end: '2025-12' }
    });
  };

  const handleApply = () => {
    fetchAllReports();
  };

  const formatDateRange = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Calculate days from date range
  useEffect(() => {
    const startDate = new Date(filters.dateRange.start);
    const endDate = new Date(filters.dateRange.end);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 0 && daysDiff !== filters.days) {
      setFilters(prev => ({ ...prev, days: daysDiff }));
    }
  }, [filters.dateRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RotateCw className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 lg:mb-8 gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Reports</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={handleExportCSV}
              disabled={loading || salesData.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            <button 
              onClick={handlePrint}
              disabled={loading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors bg-teal-600 text-white hover:bg-teal-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Error Loading Reports</h3>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button 
                onClick={fetchAllReports}
                className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:text-red-800 dark:hover:text-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Debug Info - Remove this after fixing */}
        <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold mb-2">Debug Info:</h3>
          <div className="text-xs space-y-1">
            <p>Sales Chart Data Length: {salesChartData.length}</p>
            <p>Order Distribution Data Length: {orderDistributionData.length}</p>
            <p>Expenses Chart Data Length: {expensesChartData.length}</p>
            <p className="text-blue-600 dark:text-blue-400">Check browser console for detailed logs 🔍</p>
          </div>
        </div>

        {/* Filters and Key Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
          {/* Filters */}
          <div className="lg:col-span-2 rounded-xl px-3 sm:px-4 py-4 bg-card border border-border">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-card-foreground">Filters</h2>
              <span className="px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-teal-600 text-white whitespace-nowrap">
                🔒 Authenticated
              </span>
            </div>

            <div className="space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs mb-1 text-muted-foreground font-medium">Report Type</label>
                  <div className="relative">
                    <select
                      value={filters.reportType}
                      onChange={(e) => setFilters({...filters, reportType: e.target.value})}
                      className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      <option>Sales</option>
                      <option>Orders</option>
                      <option>Expenses</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={14} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-muted-foreground font-medium">View</label>
                  <div className="relative">
                    <select
                      value={filters.view}
                      onChange={(e) => setFilters({...filters, view: e.target.value})}
                      className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      <option value="day">By Day</option>
                      <option value="week">By Week</option>
                      <option value="month">By Month</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={14} />
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs mb-1 text-muted-foreground font-medium">Days</label>
                  <input
                    type="number"
                    value={filters.days}
                    onChange={(e) => setFilters({...filters, days: parseInt(e.target.value) || 30})}
                    className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
                    min="1"
                    max="365"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs mb-1 text-muted-foreground font-medium">Outlet</label>
                  <div className="relative">
                    <select
                      value={filters.outlet}
                      onChange={(e) => setFilters({...filters, outlet: e.target.value})}
                      className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      <option>All</option>
                      <option>Main Branch</option>
                      <option>Downtown</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={14} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-muted-foreground font-medium">Payment Mode</label>
                  <div className="relative">
                    <select
                      value={filters.paymentMode}
                      onChange={(e) => setFilters({...filters, paymentMode: e.target.value})}
                      className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      <option>All</option>
                      <option>UPI</option>
                      <option>Cash</option>
                      <option>Card</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={14} />
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs mb-1 text-muted-foreground font-medium">Sort</label>
                  <div className="relative">
                    <select
                      value={filters.sort}
                      onChange={(e) => setFilters({...filters, sort: e.target.value})}
                      className="w-full text-sm px-2.5 py-1.5 rounded-lg border border-border bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      <option>Total Desc</option>
                      <option>Total Asc</option>
                      <option>Date Desc</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={14} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row justify-end gap-2 pt-1">
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm text-teal-600 border border-teal-600 hover:bg-teal-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCw size={14} />
                  Reset
                </button>
                <button
                  onClick={handleApply}
                  disabled={loading}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Filter size={14} />
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="rounded-xl px-3 sm:px-4 py-4 bg-card border border-border">
            <h2 className="text-sm sm:text-base font-semibold mb-3 text-card-foreground">Key Metrics</h2>
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-0.5">Sales</div>
                  <div className="text-sm sm:text-base font-bold text-foreground">{keyMetrics.totalSales}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-0.5">Orders</div>
                  <div className="text-sm sm:text-base font-bold text-foreground">{keyMetrics.totalOrders}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted col-span-2 sm:col-span-1">
                  <div className="text-xs text-muted-foreground mb-0.5">Expenses</div>
                  <div className="text-sm sm:text-base font-bold text-foreground">{keyMetrics.totalExpenses}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-0.5">Avg</div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">{keyMetrics.avgOrderValue}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-0.5">Margin</div>
                  <div className="text-xs sm:text-sm font-bold text-foreground">{keyMetrics.grossMargin}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted">
                  <div className="text-xs text-muted-foreground mb-0.5">Top</div>
                  <div className="text-xs font-bold text-foreground">{keyMetrics.topCategory}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Report with Line Chart */}
        <div className="rounded-xl px-3 sm:px-4 py-4 mb-4 sm:mb-6 lg:mb-8 bg-card border border-border overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-card-foreground">Sales Report</h2>
            <span className="text-xs text-muted-foreground">By selected view</span>
          </div>

          {/* Line Chart */}
          {salesChartData.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-semibold mb-3 text-card-foreground">Sales Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="sales" stroke="#14b8a6" strokeWidth={2} name="Gross Sales" />
                  <Line type="monotone" dataKey="net" stroke="#0d9488" strokeWidth={2} name="Net Sales" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mb-6 p-8 text-center bg-muted/50 rounded-lg border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground">No chart data available. Check console logs 🔍</p>
              <p className="text-xs text-muted-foreground mt-1">Sales data length: {salesChartData.length}</p>
            </div>
          )}

          <div className="overflow-x-auto -mx-3 sm:-mx-4">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Period</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Orders</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Gross</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Discount</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-sm text-muted-foreground">
                        No sales data available
                      </td>
                    </tr>
                  ) : (
                    salesData.map((row, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs font-medium text-foreground whitespace-nowrap">{row.period}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs text-foreground">{row.orders}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs text-foreground whitespace-nowrap">{row.grossSales}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs text-foreground whitespace-nowrap">{row.discounts}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs font-semibold text-foreground whitespace-nowrap">{row.net}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Orders Report with Pie Chart */}
        <div className="rounded-xl px-3 sm:px-4 py-4 mb-4 sm:mb-6 lg:mb-8 bg-card border border-border overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-card-foreground">Orders Report</h2>
            <span className="text-xs text-muted-foreground">By payment method</span>
          </div>

          {/* Pie Chart */}
          {orderDistributionData.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-semibold mb-3 text-card-foreground">Order Distribution by Payment Method</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={orderDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mb-6 p-8 text-center bg-muted/50 rounded-lg border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground">No chart data available. Check console logs 🔍</p>
              <p className="text-xs text-muted-foreground mt-1">Order distribution length: {orderDistributionData.length}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Orders by Payment Method */}
            <div className="overflow-hidden">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs sm:text-sm font-semibold text-card-foreground">By Payment Method</h3>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Desc</span>
              </div>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Method</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Orders</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Share</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Revenue</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.bySource.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-sm text-muted-foreground">
                            No order data available
                          </td>
                        </tr>
                      ) : (
                        ordersData.bySource.map((row, index) => (
                          <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-2 px-2">
                              <span className="text-xs font-medium text-foreground whitespace-nowrap">{row.source}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground">{row.orders}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground">{row.share}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground whitespace-nowrap">{row.revenue}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground">{row.rank}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payments by Mode */}
            <div className="overflow-hidden">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs sm:text-sm font-semibold text-card-foreground">Payment Summary</h3>
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Desc</span>
              </div>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Mode</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Count</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Share</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Amount</th>
                        <th className="text-left font-semibold py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersData.byPayment.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-sm text-muted-foreground">
                            No payment data available
                          </td>
                        </tr>
                      ) : (
                        ordersData.byPayment.map((row, index) => (
                          <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                            <td className="py-2 px-2">
                              <span className="text-xs font-medium text-foreground whitespace-nowrap">{row.mode}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground">{row.count}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground">{row.share}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground whitespace-nowrap">{row.amount}</span>
                            </td>
                            <td className="py-2 px-2">
                              <span className="text-xs text-foreground">{row.rank}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Report with Bar Chart */}
        <div className="rounded-xl px-3 sm:px-4 py-4 bg-card border border-border overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h2 className="text-sm sm:text-base font-semibold text-card-foreground">Expenses Report</h2>
            <span className="text-xs text-muted-foreground">By category</span>
          </div>

          {/* Bar Chart */}
          {expensesChartData.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-xs sm:text-sm font-semibold mb-3 text-card-foreground">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expensesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="amount" fill="#14b8a6" name="Amount (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mb-6 p-8 text-center bg-muted/50 rounded-lg border-2 border-dashed border-border">
              <p className="text-sm text-muted-foreground">No chart data available. Check console logs 🔍</p>
              <p className="text-xs text-muted-foreground mt-1">Expenses data length: {expensesChartData.length}</p>
            </div>
          )}

          <div className="overflow-x-auto -mx-3 sm:-mx-4">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Category</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Trans.</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Amount</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Share</th>
                    <th className="text-left font-semibold py-2 px-2 sm:px-3 text-xs text-muted-foreground whitespace-nowrap">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesData.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-sm text-muted-foreground">
                        No expenses data available
                      </td>
                    </tr>
                  ) : (
                    expensesData.map((row, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs font-medium text-foreground whitespace-nowrap">{row.category}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs text-foreground">{row.transactions}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs text-foreground whitespace-nowrap">{row.amount}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs text-foreground">{row.share}</span>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3">
                          <span className="text-xs text-foreground">{row.rank}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;