import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, RefreshCw, Printer, Download, Eye, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// API Configuration - Using environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const PastOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // API States
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyRevenueData, setWeeklyRevenueData] = useState([]);
  const [statistics, setStatistics] = useState({
    todayOrders: 0,
    revenue: 0,
    avgTicketSize: 0,
    weeklyTotal: 0
  });

  // Fetch orders with filters (removed statusFilter)
  const fetchOrders = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        skip: '0',
        limit: '100'
      });

      // Add filters to API call (no status filter)
      if (paymentFilter !== 'All') {
        params.append('payment_method', paymentFilter.toLowerCase());
      }
      if (selectedDate) {
        params.append('date', selectedDate);
      }
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      console.log('Fetching with params:', params.toString());

      const response = await fetch(`${API_BASE_URL}/orders?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched orders:', data);

      const ordersArray = data.data || [];
      const transformedOrders = transformOrdersData(ordersArray);
      setOrders(transformedOrders);
      calculateStatistics(transformedOrders);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Fetch single order details
  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching order details:', err);
      return null;
    }
  };

  const transformOrdersData = (apiData) => {
    if (!Array.isArray(apiData)) return [];

    return apiData.map(order => {
      // Extract customer info
      const customer = order.customer || {};
      const customerName = customer.first_name
        ? `${customer.first_name} ${customer.last_name || ''}`.trim()
        : 'Walk-in';

      const avatar = customerName.charAt(0).toUpperCase();
      const colors = ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#6B7280'];
      const colorIndex = customerName.length % colors.length;

      // Parse order details
      const subtotal = parseFloat(order.subtotal || 0);
      const tax = parseFloat(order.tax || 0);
      const discount = parseFloat(order.discount || 0);
      const total = parseFloat(order.total || 0);

      const orderType = order.order_type || 'Dine-in';
      const formatDateTime = (dateStr) => {
        if (!dateStr) return '--:--';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
        return `${day}-${month}-${year} | ${strTime}`;
      };

      const orderTime = formatDateTime(order.created_at);

      // Normalize status and payment
      let normalizedStatus = (order.status || 'completed').toLowerCase().trim();
      if (normalizedStatus === 'complete') normalizedStatus = 'completed';
      if (normalizedStatus === 'refund') normalizedStatus = 'refunded';

      let normalizedPayment = (order.payment_method || order.payment || 'Cash').trim();
      normalizedPayment = normalizedPayment.charAt(0).toUpperCase() + normalizedPayment.slice(1).toLowerCase();

      return {
        id: order.order_number || order.id.toString(),
        orderId: order.id,
        type: orderType,
        time: orderTime,
        customer: {
          name: customerName,
          avatar: avatar,
          color: colors[colorIndex]
        },
        items: order.order_items?.length || 0,
        subtotal: subtotal,
        gst: tax,
        discount: discount > 0 ? discount : null,
        total: total,
        payment: normalizedPayment,
        status: normalizedStatus,
        createdAt: order.created_at
      };
    });
  };

  const calculateStatistics = (ordersData) => {
    const today = new Date().toISOString().split('T')[0];

    const todaysOrders = ordersData.filter(order => {
      const orderDate = order.createdAt?.split('T')[0];
      return orderDate === today;
    });

    const todayOrderCount = todaysOrders.length;
    const todayRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
    const avgTicket = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

    const weeklyData = calculateWeeklyRevenue(ordersData);
    const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.revenue, 0);

    setStatistics({
      todayOrders: todayOrderCount,
      revenue: todayRevenue,
      avgTicketSize: avgTicket,
      weeklyTotal: weeklyTotal
    });

    setWeeklyRevenueData(weeklyData);
  };

  const calculateWeeklyRevenue = (ordersData) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = Array(7).fill(null).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: days[date.getDay()],
        date: date.toISOString().split('T')[0],
        revenue: 0,
        orders: 0
      };
    });

    ordersData.forEach(order => {
      const orderDate = order.createdAt?.split('T')[0];
      const dayData = weekData.find(d => d.date === orderDate);
      if (dayData) {
        dayData.revenue += order.total;
        dayData.orders += 1;
      }
    });

    return weekData;
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial fetch
  useEffect(() => {
    fetchOrders(true);
  }, []);

  // Filter updates - fetch silently to avoid full page refresh loader
  useEffect(() => {
    if (debouncedSearch || paymentFilter !== 'All' || selectedDate) {
      fetchOrders(false);
    } else {
      fetchOrders(false);
    }
  }, [paymentFilter, selectedDate, debouncedSearch]);

  // Client-side filtering without status filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPayment = paymentFilter === 'All' ||
      order.payment.toLowerCase() === paymentFilter.toLowerCase();

    const matchesDate = !selectedDate || order.createdAt?.split('T')[0] === selectedDate;

    return matchesSearch && matchesPayment && matchesDate;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders(false);
    setIsRefreshing(false);
  };

  const handlePrintBill = (order) => {
    // Navigate to dedicated print page in a new tab using the identifier (order_number or ID)
    window.open(`/print-bill/${order.id}`, '_blank');
  };

  const handleDownloadBill = async (order) => {
    try {
      // Ensure we have order_items if we are downloading from the list
      let fullOrder = order;
      if (!order.order_items || order.order_items.length === 0) {
        const details = await fetchOrderDetails(order.id);
        if (details) fullOrder = { ...order, ...details };
      }

      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 150]
      });

      let y = 10;
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.text('VAYUPOS INVOICE', 40, y, { align: 'center' });
      y += 8;

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      doc.text(`Order : ${fullOrder.id}`, 5, y); y += 4;
      doc.text(`Date  : ${fullOrder.time || formatDateTime(new Date())}`, 5, y); y += 4;
      doc.text(`Cust  : ${fullOrder.customer?.name || fullOrder.customer?.first_name || 'Guest'}`, 5, y); y += 6;

      doc.line(5, y, 75, y); y += 5;

      // Table Headers
      doc.setFont('courier', 'bold');
      doc.text('Item', 5, y);
      doc.text('Qty', 45, y);
      doc.text('Price', 55, y);
      doc.text('Total', 75, y, { align: 'right' }); y += 4;
      doc.line(5, y, 75, y); y += 5;

      doc.setFont('courier', 'normal');
      if (fullOrder.order_items) {
        fullOrder.order_items.forEach((item) => {
          const name = item.product_name || item.name || 'Item';
          const qty = item.quantity || item.qty || 1;
          const price = item.unit_price || item.price || 0;
          const lineTotal = qty * price;

          const splitName = doc.splitTextToSize(name, 35);
          doc.text(splitName, 5, y);
          doc.text(qty.toString(), 45, y);
          doc.text(price.toFixed(2), 55, y);
          doc.text(lineTotal.toFixed(2), 75, y, { align: 'right' });

          y += (splitName.length * 4);
          if (y > 130) { doc.addPage(); y = 10; }
        });
      }

      y += 2;
      doc.line(5, y, 75, y); y += 5;

      doc.text('Subtotal:', 5, y);
      doc.text(`₹${fullOrder.subtotal.toFixed(2)}`, 75, y, { align: 'right' }); y += 4;

      const tax = fullOrder.gst || fullOrder.tax || 0;
      const cgst = (tax / 2).toFixed(2);
      const sgst = (tax / 2).toFixed(2);
      doc.text('CGST (2.5%):', 5, y);
      doc.text(`₹${cgst}`, 75, y, { align: 'right' }); y += 4;
      doc.text('SGST (2.5%):', 5, y);
      doc.text(`₹${sgst}`, 75, y, { align: 'right' }); y += 4;

      if (fullOrder.discount > 0) {
        doc.text('Discount:', 5, y);
        doc.text(`- ₹${fullOrder.discount.toFixed(2)}`, 75, y, { align: 'right' }); y += 4;
      }

      y += 2;
      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
      doc.text('TOTAL:', 5, y);
      doc.text(`₹${fullOrder.total.toFixed(2)}`, 75, y, { align: 'right' }); y += 6;

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      doc.text(`Payment: ${fullOrder.payment}`, 5, y); y += 5;

      doc.line(5, y, 75, y); y += 6;
      doc.text('Thank you for your visit!', 40, y, { align: 'center' });

      doc.save(`Order_${fullOrder.id}.pdf`);
    } catch (err) {
      console.error('PDF Generation error:', err);
      // Fallback
      alert('Error generating PDF bill.');
    }
  };

  const handleViewBill = (order) => {
    // Navigate to full details view using the identifier (order_number or ID)
    navigate(`/orders/${order.id}`);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-semibold text-foreground">{payload[0].payload.day}</p>
          <p className="text-sm text-muted-foreground">Revenue: ₹ {payload[0].value.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Orders: {payload[0].payload.orders}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Orders</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Dedicated View/Print pages are now used instead of this modal */}

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-foreground">Past Orders</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-sm sm:text-[14px]">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 mb-4 sm:mb-6">
          <div className="rounded-lg px-4 sm:px-6 py-4 sm:py-5 border border-border bg-card">
            <div className="text-xs sm:text-[13px] mb-2 font-medium text-muted-foreground">Today Orders</div>
            <div className="text-2xl sm:text-[32px] font-bold text-foreground">{statistics.todayOrders}</div>
          </div>
          <div className="rounded-lg px-4 sm:px-6 py-4 sm:py-5 border border-border bg-card">
            <div className="text-xs sm:text-[13px] mb-2 font-medium text-muted-foreground">Revenue</div>
            <div className="text-2xl sm:text-[32px] font-bold text-foreground">₹ {statistics.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          </div>
          <div className="rounded-lg px-4 sm:px-6 py-4 sm:py-5 border border-border bg-card sm:col-span-2 lg:col-span-1">
            <div className="text-xs sm:text-[13px] mb-2 font-medium text-muted-foreground">Avg. Ticket Size</div>
            <div className="text-2xl sm:text-[32px] font-bold text-foreground">₹ {statistics.avgTicketSize.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        <div className="rounded-lg shadow-md border border-border bg-card px-4 sm:px-6 py-4 sm:py-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-[22px] font-bold text-foreground">Week Analytics</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Revenue trend for the past 7 days</p>
            </div>
            <div className="text-right">
              <div className="text-xs sm:text-sm text-muted-foreground">Weekly Total</div>
              <div className="text-xl sm:text-2xl font-bold text-foreground">₹ {statistics.weeklyTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div className="w-full" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyRevenueData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg shadow-md border border-border bg-card px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-xl lg:text-[22px] font-bold text-foreground">Order History</h2>
            <div className="text-sm text-muted-foreground">
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4 sm:mb-6">
            <div className="md:col-span-6">
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="text"
                  placeholder="Order ID, customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm sm:text-[15px] pl-11 pr-4 py-2.5 rounded-md border border-border bg-muted text-foreground placeholder-muted-foreground focus:outline-none"
                />
              </form>
            </div>

            <div className="md:col-span-3">
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-sm sm:text-[15px] px-3.5 py-2.5 rounded-md border border-border bg-muted text-foreground focus:outline-none"
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={17} />
              </div>
            </div>

            <div className="md:col-span-3">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full text-sm sm:text-[15px] px-3.5 py-2.5 rounded-md border border-border bg-muted text-foreground focus:outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">No orders found</p>
              <p className="text-muted-foreground">Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Mobile Card View */}
          {filteredOrders.length > 0 && (
            <div className="block lg:hidden space-y-3 sm:space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-muted rounded-lg p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm sm:text-base text-foreground">{order.id}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{order.type} • {order.time}</div>
                    </div>
                    <span className="inline-block px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-md text-xs sm:text-[13px] font-medium bg-primary text-primary-foreground">
                      {order.payment}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 mb-3 pb-3 border-b border-border">
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-[13px] flex-shrink-0 text-white"
                      style={{ backgroundColor: order.customer.color }}
                    >
                      {order.customer.avatar}
                    </div>
                    <span className="text-sm sm:text-[15px] text-foreground">{order.customer.name}</span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2 mb-3 pb-3 border-b border-border">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="text-foreground font-medium">{order.items}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">₹ {order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">GST</span>
                      <span className="text-foreground">₹ {order.gst.toFixed(2)}</span>
                    </div>
                    {order.discount && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="text-foreground">- ₹ {order.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm sm:text-base font-semibold pt-1">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">₹ {order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePrintBill(order)}
                      className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-[13px] font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Printer size={14} className="sm:w-4 sm:h-4" />
                      <span>Print Bill</span>
                    </button>
                    <button
                      onClick={() => handleDownloadBill(order)}
                      className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors text-foreground hover:bg-secondary border border-border text-xs sm:text-[13px]"
                    >
                      <Download size={14} className="sm:w-4 sm:h-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleViewBill(order)}
                      className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded transition-colors text-foreground hover:bg-secondary border border-border text-xs sm:text-[13px]"
                    >
                      <Eye size={14} className="sm:w-4 sm:h-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}</div>
          )}

          {/* Desktop Table View */}
          {filteredOrders.length > 0 && (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary/10 dark:bg-transparent border-b border-border">
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Order</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Date & Time</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Customer</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Items</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Subtotal</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">GST</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Discount</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Total</th>
                    <th className="text-left font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Payment</th>
                    <th className="text-right font-semibold py-3.5 px-3 text-[15px] text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-3">
                        <div className="font-semibold text-[15px] text-foreground">{order.id}</div>
                        <div className="text-[13px] mt-0.5 text-muted-foreground">{order.type}</div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="text-[15px] font-medium text-foreground">{order.time}</div>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[13px] flex-shrink-0 text-white"
                            style={{ backgroundColor: order.customer.color }}
                          >
                            {order.customer.avatar}
                          </div>
                          <span className="text-[15px] text-foreground">{order.customer.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-[15px] text-foreground">{order.items}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-[15px] text-foreground">₹ {order.subtotal.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-[15px] text-foreground">₹ {order.gst.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-[15px] text-foreground">
                          {order.discount ? `- ₹ ${order.discount.toFixed(2)}` : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="text-[15px] font-semibold text-foreground">
                          ₹ {order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="inline-block px-3.5 py-1.5 rounded-md text-[13px] font-medium bg-primary text-primary-foreground">
                          {order.payment}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePrintBill(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                            title="Print Bill"
                          >
                            <Printer size={16} />
                            <span>Print Bill</span>
                          </button>
                          <button
                            onClick={() => handleDownloadBill(order)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors text-foreground hover:bg-muted"
                            title="Download Bill"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleViewBill(order)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors text-foreground hover:bg-muted"
                            title="View Bill"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>);

};
export default PastOrders;