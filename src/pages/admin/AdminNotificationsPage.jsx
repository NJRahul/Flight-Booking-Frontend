import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell, CheckCircle, XCircle, Clock, CreditCard, AlertCircle, RefreshCw,
  CheckSquare, Trash2,
} from 'lucide-react';
import { adminApi } from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Type → icon map ──────────────────────────────────────────────────────────
const getTypeIcon = (type) => {
  const map = {
    booking_confirmed: { Icon: CheckCircle, color: 'bg-green-100 text-green-600' },
    booking_cancelled: { Icon: XCircle, color: 'bg-red-100 text-red-600' },
    flight_delay: { Icon: Clock, color: 'bg-amber-100 text-amber-600' },
    flight_cancelled: { Icon: XCircle, color: 'bg-red-100 text-red-600' },
    payment_success: { Icon: CreditCard, color: 'bg-green-100 text-green-600' },
    payment_failed: { Icon: AlertCircle, color: 'bg-red-100 text-red-600' },
  };
  return map[type] || { Icon: Bell, color: 'bg-gray-100 text-gray-600' };
};

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const map = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${map[priority] || map.low}`}>
      {priority || 'low'}
    </span>
  );
}

// ─── Skeleton notification item ───────────────────────────────────────────────
function SkeletonItem() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-white animate-pulse">
      <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-5 bg-gray-200 rounded-full w-14" />
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

// ─── Single notification card ─────────────────────────────────────────────────
function NotificationCard({ notification: n, onResolve }) {
  const { Icon, color } = getTypeIcon(n.type);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
        !n.isRead
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-100'
      }`}
    >
      {/* Icon circle */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
          {n.title}
        </p>
        {n.message && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
        )}
        {n.user && (
          <p className="text-xs text-primary-600 mt-1">
            {n.user.name}
            {n.user.email && (
              <span className="text-gray-400"> &middot; {n.user.email}</span>
            )}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {n.createdAt
            ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })
            : '—'}
        </p>
      </div>

      {/* Right side: priority + resolve */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <PriorityBadge priority={n.priority} />
        {!n.isRead && (
          <button
            onClick={() => onResolve(n._id)}
            title="Mark as resolved"
            className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        )}
        {n.isRead && (
          <CheckCircle className="w-4 h-4 text-green-500 opacity-60" />
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'high'
  const [resolvingAll, setResolvingAll] = useState(false);

  // ── Fetch notifications ──────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const r = await adminApi.get('/notifications');
      setNotifications(r.data.data?.notifications || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  // ── Resolve single ───────────────────────────────────────────────────────────
  const resolveOne = async (id) => {
    try {
      await adminApi.put(`/notifications/${id}/resolve`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch {
      toast.error('Failed to resolve notification');
    }
  };

  // ── Resolve all unread ───────────────────────────────────────────────────────
  const resolveAll = async () => {
    const unresolved = filtered.filter(n => !n.isRead);
    if (unresolved.length === 0) {
      toast('No unread notifications to resolve');
      return;
    }
    setResolvingAll(true);
    await Promise.all(
      unresolved.map(n => adminApi.put(`/notifications/${n._id}/resolve`).catch(() => {}))
    );
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All resolved');
    setResolvingAll(false);
  };

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'high') return n.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 font-display">System Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={resolveAll}
            disabled={resolvingAll || unreadCount === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            Resolve All
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { v: 'all', label: 'All' },
          { v: 'unread', label: 'Unread' },
          { v: 'high', label: 'High Priority' },
        ].map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === v
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
            {v === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-px">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {loading ? (
          [...Array(5)].map((_, i) => <SkeletonItem key={i} />)
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'unread'
                ? 'All caught up! No unread notifications.'
                : filter === 'high'
                ? 'No high-priority notifications.'
                : 'No notifications yet.'}
            </p>
          </div>
        ) : (
          filtered.map(n => (
            <NotificationCard
              key={n._id}
              notification={n}
              onResolve={resolveOne}
            />
          ))
        )}
      </div>

      {/* Summary footer */}
      {!loading && notifications.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Showing {filtered.length} of {notifications.length} notifications
        </p>
      )}
    </div>
  );
}
