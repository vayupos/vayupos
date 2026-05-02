import React, { useState, useEffect } from 'react';
import {
  IndianRupee, ShoppingBag, TrendingUp, Wallet,
  RefreshCw, AlertTriangle, Utensils, Package,
  ChefHat, BarChart3, ChevronRight, Clock, Zap
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import axios_api from '../api/axios';

const getTimeAgo = (dateString) => {
  if (!dateString) return '--';
  const diffMins = Math.floor((Date.now() - new Date(dateString)) / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const h = Math.floor(diffMins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const StatCard = ({ label, value, icon: Icon, color = 'teal', sub }) => (
  <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <div className={`p-2 rounded-xl bg-${color}-500/10`}>
        <Icon className={`text-${color}-500 h-5 w-5`} />
      </div>
    </div>
    <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const Dashboard = ({ onNavigate }) => {
  const [summary, setSummary] = useState({ todaySales: 0, ordersCount: 0, avgOrderValue: 0, totalExpenses: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [orderTypeStats, setOrderTypeStats] = useState({ dine_in: { count: 0, percentage: 0 }, takeaway: { count: 0, percentage: 0 } });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.allSettled([
      loadSummary(),
      loadRecentOrders(),
      loadActivities(),
      loadLowStock(),
      loadOrderTypeStats(),
      loadRestaurantName(),
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const loadRestaurantName = async () => {
    try {
      const res = await axios_api.get('/settings');
      setRestaurantName(res.data.restaurant_name || '');
    } catch { /* silently skip */ }
  };

  const loadSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios_api.get('/reports/daily-summary', { params: { date: today } });
      const d = res.data.data || {};
      setSummary({
        todaySales: d.total_sales || 0,
        ordersCount: d.orders_count || 0,
        avgOrderValue: d.average_order_value || 0,
        totalExpenses: d.total_expenses || 0,
      });
    } catch { /* keep defaults */ }
  };

  const loadRecentOrders = async () => {
    try {
      const res = await axios_api.get('/orders', { params: { skip: 0, limit: 5 } });
      const raw = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setRecentOrders(raw.map(o => ({
        id: o.order_number || `#${o.id}`,
        type: o.order_type === 'dine_in' ? 'Dine-in' : 'Takeaway',
        amount: parseFloat(o.total || 0),
        time: getTimeAgo(o.created_at),
        status: o.status,
      })));
    } catch { /* keep empty */ }
  };

  const loadActivities = async () => {
    try {
      const res = await axios_api.get('/notifications', { params: { limit: 6 } });
      const raw = Array.isArray(res.data) ? res.data : [];
      setActivities(raw.map(n => ({
        title: n.title,
        desc: n.description,
        time: getTimeAgo(n.created_at),
      })));
    } catch { /* keep empty */ }
  };

  const loadLowStock = async () => {
    try {
      const res = await axios_api.get('/ingredients/stock/low');
      setLowStockAlerts(res.data || []);
    } catch { /* keep empty */ }
  };

  const loadOrderTypeStats = async () => {
    try {
      const res = await axios_api.get('/reports/order-type-stats', { params: { days: 30 } });
      setOrderTypeStats(res.data);
    } catch { /* keep defaults */ }
  };

  const totalOrders = (orderTypeStats.dine_in?.count || 0) + (orderTypeStats.takeaway?.count || 0);
  const profit = summary.todaySales - summary.totalExpenses;
  const pieData = [
    { name: 'Dine-in', value: orderTypeStats.dine_in?.count || 0 },
    { name: 'Takeaway', value: orderTypeStats.takeaway?.count || 0 },
  ];
  const hasOrders = totalOrders > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <RefreshCw className="animate-spin h-10 w-10 text-primary" />
        <p className="text-muted-foreground text-sm">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background min-h-screen max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {getGreeting()}{restaurantName ? `, ${restaurantName}` : ''}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Low Stock Banner ── */}
      {lowStockAlerts.length > 0 && (
        <div
          className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('stock')}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-500 h-5 w-5 shrink-0" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">
              {lowStockAlerts.length} ingredient{lowStockAlerts.length > 1 ? 's' : ''} running low — tap to restock
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockAlerts.map(a => (
              <span key={a.id} className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                {a.ingredient_name}: {a.available_quantity} {a.ingredient_unit} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Revenue"
          value={`₹${summary.todaySales.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          color="teal"
          sub={profit >= 0 ? `₹${profit.toLocaleString('en-IN')} after expenses` : `₹${Math.abs(profit).toLocaleString('en-IN')} over expenses`}
        />
        <StatCard
          label="Orders Today"
          value={summary.ordersCount}
          icon={ShoppingBag}
          color="blue"
          sub={summary.ordersCount === 0 ? 'No orders yet' : `${summary.ordersCount} completed`}
        />
        <StatCard
          label="Avg Order Value"
          value={`₹${summary.avgOrderValue.toLocaleString('en-IN')}`}
          icon={TrendingUp}
          color="violet"
        />
        <StatCard
          label="Today's Expenses"
          value={`₹${summary.totalExpenses.toLocaleString('en-IN')}`}
          icon={Wallet}
          color="amber"
        />
      </div>

      {/* ── Quick Actions + Order Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Quick Actions */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Quick Actions
          </h2>
          <div className="space-y-2.5">
            {[
              { label: 'Open POS', desc: 'Start billing customers', action: 'pos', icon: IndianRupee, color: 'bg-teal-600 hover:bg-teal-700' },
              { label: 'Kitchen Orders', desc: 'View & manage KOT', action: 'kot', icon: ChefHat, color: 'bg-orange-500 hover:bg-orange-600' },
              { label: 'Business Reports', desc: 'Sales and analytics', action: 'reports', icon: BarChart3, color: 'bg-blue-600 hover:bg-blue-700' },
            ].map((item) => (
              <button
                key={item.action}
                onClick={() => onNavigate(item.action)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:bg-muted transition-colors text-left group"
              >
                <div className={`p-2 rounded-lg ${item.color} transition-colors`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Order Type Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Order Distribution <span className="text-xs text-muted-foreground font-normal ml-1">(last 30 days)</span></h2>
            {hasOrders && (
              <span className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground font-medium">
                {totalOrders} total
              </span>
            )}
          </div>

          {!hasOrders ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">No orders in the last 30 days</p>
              <p className="text-xs text-muted-foreground mt-1">Open POS to start taking orders</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                      <Cell fill="#14b8a6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v} orders`]}
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 w-full space-y-3">
                {[
                  { label: 'Dine-in', stats: orderTypeStats.dine_in, color: 'teal', icon: Utensils },
                  { label: 'Takeaway', stats: orderTypeStats.takeaway, color: 'amber', icon: Package },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <item.icon className={`h-4 w-4 text-${item.color}-500`} />
                        <span className="font-medium text-foreground">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-${item.color}-600`}>{item.stats?.count || 0}</span>
                        <span className="text-muted-foreground text-xs">({item.stats?.percentage || 0}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${item.color}-500 rounded-full transition-all duration-500`}
                        style={{ width: `${item.stats?.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {orderTypeStats.dine_in?.count > orderTypeStats.takeaway?.count
                      ? 'Dine-in is your main revenue stream. Focus on table experience.'
                      : orderTypeStats.takeaway?.count > orderTypeStats.dine_in?.count
                        ? 'Takeaway is leading. Consider packaging and speed.'
                        : 'Even split between dine-in and takeaway.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Orders */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <button
              onClick={() => onNavigate('past-orders')}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              See all <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No orders yet today</p>
              <button
                onClick={() => onNavigate('pos')}
                className="mt-3 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Open POS
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${order.type === 'Dine-in' ? 'bg-teal-500/10' : 'bg-amber-500/10'}`}>
                      {order.type === 'Dine-in'
                        ? <Utensils className="h-3.5 w-3.5 text-teal-500" />
                        : <Package className="h-3.5 w-3.5 text-amber-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{order.id}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {order.time} · {order.type}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-foreground text-sm shrink-0 ml-2">₹{order.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity / Notifications */}
        <div className="bg-white dark:bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>

          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground">{a.title}</p>
                    {a.desc && <p className="text-xs text-muted-foreground mt-0.5 italic">{a.desc}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
