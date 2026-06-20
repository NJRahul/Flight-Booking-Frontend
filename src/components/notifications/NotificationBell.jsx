import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, XCircle, Clock, CreditCard, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { notificationApi } from '../../api/axios';

const getTypeIcon = (type) => {
  const map = {
    booking_confirmed: { Icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    booking_cancelled: { Icon: XCircle, color: 'bg-red-100 text-red-600' },
    flight_delay: { Icon: Clock, color: 'bg-amber-100 text-amber-600' },
    flight_cancelled: { Icon: XCircle, color: 'bg-red-100 text-red-600' },
    payment_success: { Icon: CreditCard, color: 'bg-green-100 text-green-600' },
    payment_failed: { Icon: AlertCircle, color: 'bg-red-100 text-red-600' },
    check_in_reminder: { Icon: Bell, color: 'bg-primary-100 text-primary-600' },
    refund_processed: { Icon: RefreshCw, color: 'bg-blue-100 text-blue-600' },
  };
  return map[type] || { Icon: Bell, color: 'bg-gray-100 text-gray-600' };
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, setNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationApi.get('/?limit=10').then(r => {
      const raw = r.data.data?.notifications || [];
      setNotifications(raw.map(n => ({ ...n, id: n._id, read: n.isRead })));
    }).catch(() => {});
  }, [isAuthenticated]);

  // Socket joining is handled globally by RealTimeNotifications — no duplicate listener here

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkAllRead = async () => {
    await notificationApi.put('/read-all').catch(() => {});
    markAllAsRead();
  };

  const handleItemClick = async (n) => {
    if (!n.read) {
      await notificationApi.put(`/${n.id}/read`).catch(() => {});
      markAsRead(n.id);
    }
  };

  const recentFive = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-navy-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentFive.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-10 h-10 mb-2" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              recentFive.map(n => {
                const { Icon, color } = getTypeIcon(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-xl mx-1 my-0.5 transition-colors ${
                      !n.read ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-gray-900 truncate`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <Link
              to="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
