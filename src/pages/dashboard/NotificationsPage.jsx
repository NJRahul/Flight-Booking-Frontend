import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, CheckCircle, XCircle, Clock, CreditCard, AlertCircle, RefreshCw, Trash2, Check,
} from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { notificationApi } from '../../api/axios';
import toast from 'react-hot-toast';

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

const FILTER_LABELS = {
  all: 'All',
  unread: 'Unread',
  booking: 'Booking Updates',
  flight: 'Flight Alerts',
};

export default function NotificationsPage() {
  const {
    notifications, unreadCount, setNotifications, markAsRead, markAllAsRead, removeNotification,
  } = useNotificationStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    notificationApi.get('/').then(r => {
      const raw = r.data.data?.notifications || r.data.notifications || [];
      setNotifications(raw.map(n => ({ ...n, id: n._id || n.id, read: n.isRead ?? n.read })));
    }).catch(() => toast.error('Failed to load notifications')).finally(() => setLoading(false));
  }, [setNotifications]);

  // Socket listening and real-time updates are handled globally by RealTimeNotifications

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'booking') return ['booking_confirmed', 'booking_cancelled'].includes(n.type);
    if (filter === 'flight') return ['flight_delay', 'flight_cancelled', 'check_in_reminder'].includes(n.type);
    return true;
  });

  const handleMarkRead = async (n) => {
    if (n.read) return;
    await notificationApi.put(`/${n.id}/read`).catch(() => {});
    markAsRead(n.id);
  };

  const handleMarkAllRead = async () => {
    await notificationApi.put('/read-all').catch(() => {});
    markAllAsRead();
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await notificationApi.delete(`/${id}`).catch(() => {});
    removeNotification(id);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-4 h-20 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-navy-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {['all', 'unread', 'booking', 'flight'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filtered.length === 0 ? (
        <div className="card p-10 flex flex-col items-center justify-center text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filter === 'all' ? "You're all caught up!" : 'No notifications matching this filter'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'all' ? 'No notifications yet.' : 'Try a different filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const { Icon, color } = getTypeIcon(n.type);
            return (
              <div
                key={n.id}
                onClick={() => handleMarkRead(n)}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  !n.read
                    ? 'bg-primary-50 border-primary-200 border-l-4 border-l-primary-500 pl-3'
                    : 'bg-white border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                    {n.title}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
