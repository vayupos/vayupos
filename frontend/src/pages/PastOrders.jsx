import React, { useState, useEffect } from 'react';
import { Search, Calendar, RefreshCw, Printer, Download, Eye, X, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// API Configuration
const API_BASE_URL = 'https://restaurant-vayupos.onrender.com/api/v1';

const PastOrders = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
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
      if (searchQuery) {
        params.append('search', searchQuery);
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
      const orderTime = order.created_at 
        ? new Date(order.created_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '--:--';

      // Normalize status and payment
      let normalizedStatus = (order.status || 'completed').toLowerCase().trim();
      if (normalizedStatus === 'complete') normalizedStatus = 'completed';
      if (normalizedStatus === 'refund') normalizedStatus = 'refunded';

      let normalizedPayment = (order.payment_method || order.payment || 'Cash').trim();
      normalizedPayment = normalizedPayment.charAt(0).toUpperCase() + normalizedPayment.slice(1).toLowerCase();

      return {
        id: order.order_number || `#${order.id}`,
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

  // useEffect without statusFilter dependency
  useEffect(() => {
    fetchOrders();
  }, [paymentFilter, selectedDate, searchQuery]);

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

  const handlePrintBill = async (order) => {
    if (order.orderId) {
      const fullOrderDetails = await fetchOrderDetails(order.orderId);
      if (fullOrderDetails) {
        setSelectedOrder({ ...order, ...fullOrderDetails });
      } else {
        setSelectedOrder(order);
      }
    } else {
      setSelectedOrder(order);
    }
    setShowBillModal(true);
  };

  const handleActualPrint = () => {
    window.print();
  };

  const handleDownloadBill = (order) => {
    const billContent = `Restaurant Bill

Order ID: ${order.id}
Type: ${order.type}
Date: ${order.createdAt?.split('T')[0] || selectedDate}
Time: ${order.time}

Customer: ${order.customer.name}

Items: ${order.items}

Subtotal:     ₹ ${order.subtotal.toFixed(2)}
GST:          ₹ ${order.gst.toFixed(2)}
${order.discount ? `Discount:     - ₹ ${order.discount.toFixed(2)}\n` : ''}
TOTAL:        ₹ ${order.total.toFixed(2)}

Payment Method: ${order.payment}

Thank you for your visit!`;
    
    const blob = new Blob([billContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bill_${order.id}_${order.createdAt?.split('T')[0] || selectedDate}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleViewBill = async (order) => {
    await handlePrintBill(order);
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
      {showBillModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border shadow-xl rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Bill Preview</h3>
              <button
                onClick={() => setShowBillModal(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-6" id="bill-content">
              <div className="font-mono">
                <h2 className="text-center text-xl font-bold border-b-2 border-foreground pb-3 mb-4 text-foreground">
                  VAYUPOS RESTAURANT
                </h2>
                
                <div className="space-y-2 mb-4">
                  <p className="text-foreground"><strong>Order ID:</strong> {selectedOrder.id}</p>
                  <p className="text-foreground"><strong>Type:</strong> {selectedOrder.type}</p>
                  <p className="text-foreground"><strong>Date:</strong> {selectedOrder.createdAt?.split('T')[0] || selectedDate}</p>
                  <p className="text-foreground"><strong>Time:</strong> {selectedOrder.time}</p>
                </div>
                
                <p className="mb-4 text-foreground"><strong>Customer:</strong> {selectedOrder.customer.name}</p>
                
                <hr className="border-dashed border-foreground my-4" />
                
                <p className="mb-4 text-foreground"><strong>Items:</strong> {selectedOrder.items}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-foreground">
                    <span>Subtotal:</span>
                    <span>₹ {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground">
                    <span>GST:</span>
                    <span>₹ {selectedOrder.gst.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount && (
                    <div className="flex justify-between text-foreground">
                      <span>Discount:</span>
                      <span>- ₹ {selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <hr className="border-2 border-foreground my-4" />
                
                <div className="flex justify-between text-lg font-bold mb-4 text-foreground">
                  <span>TOTAL:</span>
                  <span>₹ {selectedOrder.total.toFixed(2)}</span>
                </div>
                
                <hr className="border-2 border-foreground my-4" />
                
                <p className="mb-4 text-foreground"><strong>Payment Method:</strong> {selectedOrder.payment}</p>
                
                <p className="text-center mt-6 text-foreground">Thank you for your visit!</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-card border-t border-border px-6 py-4 flex gap-3">
              <button
                onClick={handleActualPrint}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Printer size={16} />
                <span>Print</span>
              </button>
              <button
                onClick={() => handleDownloadBill(selectedOrder)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
              <button
                onClick={() => setShowBillModal(false)}
                className="flex-1 py-2 bg-muted text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="text"
                  placeholder="Order ID, customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm sm:text-[15px] pl-11 pr-4 py-2.5 rounded-md border border-border bg-muted text-foreground placeholder-muted-foreground focus:outline-none"
                />
              </div>
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
              <tr className="border-b border-border">
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