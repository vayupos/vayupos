import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, TrendingUp, Wallet, RefreshCw, AlertCircle, Lock, AlertTriangle, Utensils, Package, Search, Plus, Tag } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatDateTime } from '../utils/formatters';
import axios_api from "../api/axios";

const Dashboard = ({ isDarkMode = true, onNavigate }) => {
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
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [orderTypeStats, setOrderTypeStats] = useState({
    dine_in: { count: 0, percentage: 0 },
    takeaway: { count: 0, percentage: 0 }
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [staffAccessDenied, setStaffAccessDenied] = useState(false);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        fetchExpenses(),
        fetchActivities(),
        fetchLowStockAlerts(),
        fetchOrderTypeStats()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await axios_api.get('/reports/daily-summary', { params: { date: today } });
      const data = response.data.data || {};
      setDailySummary({
        todaySales: data.total_sales || 0,
        ordersCount: data.orders_count || 0,
        avgTicket: data.average_order_value || 0,
        totalExpenses: data.total_expenses || 0
      });
    } catch (err) { console.error(err); }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await axios_api.get('/ingredients/stock/low');
      setLowStockAlerts(response.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchRecentOrders = async () => {
    try {
      const response = await axios_api.get('/orders', { params: { skip: 0, limit: 5 } });
      const data = response.data;
      const ordersArray = Array.isArray(data) ? data : (data.data || []);
      setRecentOrders(ordersArray.map(order => ({
        id: order.order_number || `#${order.id}`,
        type: order.order_type || 'Dine-In',
        time: getTimeAgo(order.created_at),
        amount: parseFloat(order.total || 0)
      })));
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios_api.get('/customers/', { params: { skip: 0, limit: 10 } });
      const data = response.data;
      const customersArray = Array.isArray(data) ? data : (data.data || data.items || []);
      setCustomers(customersArray.map(customer => ({
        id: customer.id,
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'No Name',
        phone: customer.phone || '',
        orders: customer.total_orders || 0
      })));
    } catch (err) { console.error(err); }
  };

  const fetchOffers = async () => {
    try {
      const response = await axios_api.get('/coupons', { params: { skip: 0, limit: 10, active_only: true } });
      const data = response.data;
      const offersArray = Array.isArray(data) ? data : (data.data || []);
      setOffers(offersArray.map(offer => ({
        id: offer.id,
        code: offer.code,
        type: offer.discount_type === 'percentage' ? 'Percentage' : 'Flat',
        value: offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`,
        category: offer.description || 'General'
      })));
    } catch (err) { console.error(err); }
  };

  const fetchStaff = async () => {
    try {
      const response = await axios_api.get('/staff/', { params: { skip: 0, limit: 10 } });
      setStaff(Array.isArray(response.data) ? response.data : (response.data.data || []));
      setStaffAccessDenied(false);
    } catch (err) {
      if (err.response?.status === 403) setStaffAccessDenied(true);
      setStaff([]);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await axios_api.get('/expenses/', { params: { skip: 0, limit: 10 } });
      const data = response.data;
      const expensesArray = Array.isArray(data) ? data : (data.data || []);
      setExpenses(expensesArray.map(exp => ({
        id: exp.id,
        title: exp.title,
        amount: `₹ ${exp.amount?.toLocaleString() || 0}`,
        date: new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      })));
    } catch (err) { console.error(err); }
  };

  const fetchActivities = async () => {
    try {
      const response = await axios_api.get('/notifications', { params: { limit: 5 } });
      const data = response.data;
      setActivities((Array.isArray(data) ? data : []).map(notif => ({
        action: notif.title,
        time: getTimeAgo(notif.created_at),
        description: notif.description
      })));
    } catch (err) { console.error(err); }
  };

  const fetchOrderTypeStats = async () => {
    try {
      const response = await axios_api.get('/reports/order-type-stats', { params: { days: 30 } });
      setOrderTypeStats(response.data);
    } catch (err) { console.error(err); }
  };

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
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="animate-spin h-12 w-12 text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="text-red-500 h-5 w-5" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {lowStockAlerts.map(alert => (
              <div key={alert.id} className="bg-white dark:bg-card border border-red-100 dark:border-red-800/50 rounded-lg p-4 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('stock')}>
                <div>
                  <p className="font-semibold text-foreground">{alert.ingredient_name}</p>
                  <p className="text-xs text-muted-foreground">Threshold: {alert.threshold} {alert.ingredient_unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600 dark:text-red-400">{alert.available_quantity}</p>
                  <p className="text-xs text-red-500/70">{alert.ingredient_unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {[
          { label: 'Today Sales', value: `₹${dailySummary.todaySales.toLocaleString()}`, icon: DollarSign },
          { label: 'Orders', value: dailySummary.ordersCount, icon: ShoppingBag },
          { label: 'Avg Ticket', value: `₹${dailySummary.avgTicket.toLocaleString()}`, icon: TrendingUp },
          { label: 'Expenses', value: `₹${dailySummary.totalExpenses.toLocaleString()}`, icon: Wallet }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-card border border-border shadow-sm hover:shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-muted-foreground text-xs sm:text-sm">{stat.label}</p>
              <stat.icon className="text-teal-400" size={18} />
            </div>
            <p className="text-xl sm:text-3xl font-bold text-card-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Order Type Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white dark:bg-card border border-border shadow-sm hover:shadow-md rounded-xl p-6 transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-card-foreground">Order Type Distribution</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                <span className="text-xs text-muted-foreground">Dine-in</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-muted-foreground">Takeaway</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Dine-in', value: orderTypeStats.dine_in.count || 0 },
                      { name: 'Takeaway', value: orderTypeStats.takeaway.count || 0 }
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    <Cell fill="#14b8a6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Dine-in Orders', stats: orderTypeStats.dine_in, color: 'teal', icon: Utensils },
                { label: 'Takeaway Orders', stats: orderTypeStats.takeaway, color: 'amber', icon: Package }
              ].map((item, i) => (
                <div key={i} className={`p-4 bg-${item.color}-500/5 border border-${item.color}-500/10 rounded-xl`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <item.icon size={18} className={`text-${item.color}-600`} />
                      <span className="font-medium text-foreground">{item.label}</span>
                    </div>
                    <span className={`text-lg font-bold text-${item.color}-600`}>{item.stats.count}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className={`flex-1 bg-${item.color}-200 dark:bg-${item.color}-900/40 rounded-full h-1.5`}>
                      <div className={`bg-${item.color}-500 h-1.5 rounded-full`} style={{ width: `${item.stats.percentage}%` }}></div>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">{item.stats.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-teal-600 to-teal-800 rounded-xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Business Insight</h3>
            <p className="text-teal-50 text-sm leading-relaxed">
              {orderTypeStats.dine_in.count > orderTypeStats.takeaway.count 
                ? "Dine-in is your primary revenue driver. Consider optimizing table turnover and dining experience."
                : orderTypeStats.takeaway.count > 0 
                  ? "Takeaway orders are performing well. You might want to explore delivery partnerships or loyalty perks."
                  : "Start taking orders to see real-time insights and distribution here!"}
            </p>
          </div>
          <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
            <p className="text-xs text-teal-100 uppercase tracking-wider mb-1">Total Orders (30d)</p>
            <p className="text-3xl font-bold">{orderTypeStats.dine_in.count + orderTypeStats.takeaway.count}</p>
          </div>
        </div>
      </div>

      {/* Lower Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Links */}
        <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Quick Links</h3>
          <div className="space-y-3">
            {[
              { label: 'Open POS', desc: 'Start billing and print KOT', action: 'pos', btn: 'Open' },
              { label: 'Manage Menu', desc: 'Categories, items and prices', action: 'menu', btn: 'Menu' },
              { label: 'View Reports', desc: 'Sales and orders', action: 'reports', btn: 'Reports' }
            ].map((link, i) => (
              <button key={i} onClick={() => onNavigate(link.action)} className="w-full flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-secondary transition text-foreground">
                <div className="text-left">
                  <p className="font-medium text-sm sm:text-base">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <span className="px-3 py-1 bg-teal-600 text-xs rounded text-white">{link.btn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Recent Orders</h3>
            <button onClick={() => onNavigate('past-orders')} className="text-teal-400 text-sm hover:underline">See all</button>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p> :
              recentOrders.slice(0, 3).map(order => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="text-foreground">
                    <p className="font-medium text-xs sm:text-sm">{order.id} • {order.type}</p>
                    <p className="text-xs text-muted-foreground">{order.time}</p>
                  </div>
                  <p className="font-semibold text-foreground text-sm sm:text-base">₹{order.amount.toLocaleString()}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Activity Log</h3>
          <div className="space-y-3">
            {activities.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p> :
              activities.map((activity, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground text-sm sm:text-base">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                  {activity.description && <p className="text-xs text-muted-foreground mt-1 italic">{activity.description}</p>}
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Customers */}
        <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Customers</h3>
            <button onClick={() => onNavigate('customers')} className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">Add</button>
          </div>
          <div className="space-y-2">
            {customers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No customers yet</p> :
              customers.slice(0, 5).map((cust, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground">{cust.name}</p>
                  <p className="text-xs text-muted-foreground">{cust.phone} • {cust.orders} orders</p>
                </div>
              ))}
          </div>
        </div>

        {/* Offers */}
        <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Offers</h3>
            <button onClick={() => onNavigate('offers')} className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">Create</button>
          </div>
          <div className="space-y-2">
            {offers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No active offers</p> :
              offers.map((offer, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-foreground">{offer.code}</p>
                  <p className="text-xs text-muted-foreground">{offer.type} • {offer.value} • {offer.category}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff */}
        <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Staff</h3>
            <button onClick={() => onNavigate('staff')} className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">Add</button>
          </div>
          <div className="space-y-2">
            {staffAccessDenied ? (
              <div className="text-center py-6">
                <Lock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Staff data requires authentication</p>
              </div>
            ) : staff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No staff members yet</p>
            ) : staff.map((member, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role} • {member.payscale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-card border border-border shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Expenses</h3>
            <button onClick={() => onNavigate('expenses')} className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700">Add</button>
          </div>
          <div className="space-y-2">
            {expenses.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded</p> :
              expenses.slice(0, 5).map((exp, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <p className="font-medium text-sm text-foreground">{exp.title}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">{exp.date}</p>
                    <p className="font-semibold text-foreground">{exp.amount}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;