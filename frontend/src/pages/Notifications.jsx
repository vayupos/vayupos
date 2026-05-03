import { useState, useEffect } from 'react';
import { Bell, Clock, Filter, CheckCheck, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const Notifications = () => {
  const [filter, setFilter] = useState('all'); // all, read, unread
  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const response = await api.get('/notifications', {
        params: {
          skip: 0,
          limit: 100
        }
      });

      const data = response.data;

      // Transform API data to match component structure
      const transformedNotifications = Array.isArray(data) ? data.map(notif => ({
        id: notif.id,
        title: notif.title,
        description: notif.description,
        time: formatTime(notif.created_at),
        isRead: notif.is_read,
        category: notif.category,
        created_at: notif.created_at
      })) : [];

      setAllNotifications(transformedNotifications);

    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Helper function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // 🔥 FIXED: Initial fetch + AUTO-POLLING every 5 seconds
  useEffect(() => {
    fetchNotifications(); // Initial load

    // POLLING: Check for new notifications every 5 seconds
    const interval = setInterval(() => {
      fetchNotifications(false); // Silent refresh (no loading spinner)
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotifications = allNotifications.filter((notif) => {
    if (filter === 'read') return notif.isRead;
    if (filter === 'unread') return !notif.isRead;
    return true;
  });

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  // 🔥 FIXED: Use PATCH /mark-all-read endpoint
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');

      // Refresh from API
      await fetchNotifications(false);
    } catch (err) {
      console.error('Error marking all as read:', err);
      alert('Failed to mark all notifications as read');
    }
  };

  // 🔥 FIXED: Use DELETE /all endpoint
  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }

    try {
      await api.delete('/notifications/all');
      setAllNotifications([]);
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      alert('Failed to delete all notifications');
    }
  };

  // 🔥 FIXED: Use PATCH /{id}/read endpoint
  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      // Update local state optimistically
      setAllNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking as read:', err);
      alert('Failed to mark notification as read');
    }
  };

  // 🔥 FIXED: Use DELETE /{id} endpoint
  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);

      // Update local state optimistically
      setAllNotifications(prevNotifications =>
        prevNotifications.filter(notif => notif.id !== id)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications(false);
    setIsRefreshing(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error Loading Notifications</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => fetchNotifications()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-5 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
                <Bell className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
                Notifications
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors text-foreground hover:bg-secondary bg-card border border-border disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${unreadCount === 0
                    ? 'text-muted-foreground bg-secondary/50 cursor-not-allowed opacity-50'
                    : 'text-foreground hover:bg-secondary bg-card border border-border'
                  }`}
              >
                <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                <span className="hidden xs:inline sm:hidden md:inline">Mark all read</span>
                <span className="xs:hidden sm:inline md:hidden">Read all</span>
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={allNotifications.length === 0}
                className={`flex items-center gap-1 sm:gap-1.5 md:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${allNotifications.length === 0
                    ? 'text-muted-foreground bg-secondary/50 cursor-not-allowed opacity-50'
                    : 'text-destructive hover:bg-destructive/10 bg-card border border-border'
                  }`}
              >
                <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                <span className="hidden xs:inline sm:hidden md:inline">Clear all</span>
                <span className="xs:hidden sm:inline md:hidden">Clear</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${filter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${filter === 'unread'
                    ? 'bg-teal-600 text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-teal-700 text-white text-[10px] sm:text-xs rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${filter === 'read'
                    ? 'bg-teal-600 text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
              >
                Read
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-card border border-border rounded-lg p-3 sm:p-3.5 md:p-4 hover:shadow-md transition-all ${!notification.isRead ? 'border-l-4 border-l-teal-600' : ''
                  }`}
              >
                <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
                  {/* Status Indicator */}
                  <div className="mt-1 shrink-0">
                    {!notification.isRead && (
                      <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 bg-teal-600 rounded-full" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-xs sm:text-sm md:text-base font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                    >
                      {notification.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                      {notification.description}
                    </p>
                    <div className="flex items-center gap-1 mt-1 sm:mt-1.5 md:mt-2">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground shrink-0" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {notification.time}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 sm:p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-muted-foreground hover:text-teal-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1 sm:p-1.5 md:p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 sm:p-8 md:p-10 lg:p-12 text-center">
              <Bell className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 mx-auto mb-2 sm:mb-3 md:mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-foreground mb-1 sm:mb-1.5 md:mb-2">
                No notifications
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filter === 'unread' && 'You have no unread notifications'}
                {filter === 'read' && 'You have no read notifications'}
                {filter === 'all' && 'You have no notifications'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
