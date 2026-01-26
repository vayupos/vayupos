import { useState, useRef, useEffect } from 'react';
import { Bell, Clock, CheckCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://restaurant-vayupos.onrender.com/api/v1';

const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      // Fetch only the latest 5 for the dropdown, but we also need unread count
      // Ideally backend would give a summary, but for now we fetch a small batch
      // To get accurate unread count, we might need a separate endpoint or fetch more
      // For now, let's fetch 10 items
      const params = new URLSearchParams({ skip: '0', limit: '10' });

      const response = await fetch(`${API_BASE_URL}/notifications?${params.toString()}`);

      if (!response.ok) return;

      const data = await response.json();

      const transformedNotifications = Array.isArray(data) ? data.map(notif => ({
        id: notif.id,
        title: notif.title,
        description: notif.description,
        time: formatTime(notif.created_at),
        isRead: notif.is_read || false, // Ensure API returns is_read or handle mapped name
        created_at: notif.created_at
      })) : [];

      setNotifications(transformedNotifications);

      // Calculate unread count from the fetched batch (approximate) or potentially all
      // If the API supports filtering unread_only=true count, that would be better.
      // For now, let's calculate based on what we have or add a separate count fetch if needed.
      // A better approach for unread count is to fetch unread_only=true with a limit just to check count?
      // Or just count from the latest batch. Let's count from latest batch for simplicity first.
      setUnreadCount(transformedNotifications.filter(n => !n.isRead).length);

    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Helper function to format time (same as in Notifications.jsx)
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

  // Initial fetch + Polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s for dropdown
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' });
      // Optimistic update
      const notif = notifications.find(n => n.id === id);
      if (notif && !notif.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const displayedNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button with Number Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-secondary rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown content */}
          <div className="fixed md:absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 top-14 md:top-full md:mt-2 w-[95vw] md:w-96 max-w-md bg-card border border-border rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-4 border-b border-border">
              <div>
                <h3 className="text-sm md:text-base font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {unreadCount} unread
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-4 w-4 text-teal-600" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 md:p-2 hover:bg-secondary rounded-lg transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto">
              {displayedNotifications.length > 0 ? (
                <div className="divide-y divide-border">
                  {displayedNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 md:p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-muted/30' : ''
                        }`}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        {/* Status indicator */}
                        <div className="mt-1 flex-shrink-0">
                          {!notification.isRead ? (
                            <div className="h-2 w-2 bg-teal-600 rounded-full"></div>
                          ) : (
                            <div className="h-2 w-2"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs md:text-sm font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                            {notification.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5 md:mt-1 line-clamp-2">
                            {notification.description}
                          </p>
                          <div className="flex items-center gap-1 mt-1 md:mt-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {notification.time}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col md:flex-row items-center gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-1.5 hover:bg-secondary rounded transition-colors"
                              title="Mark as read"
                            >
                              <CheckCheck className="h-3.5 w-3.5 text-muted-foreground hover:text-teal-600" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 md:p-12 text-center">
                  <Bell className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {displayedNotifications.length > 0 && (
              <div className="p-3 border-t border-border">
                <button
                  onClick={handleViewAll}
                  className="w-full py-2 text-xs md:text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-600/10 rounded-lg transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;