import { useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, Clock, CreditCard, Bell, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSocket from '../../hooks/useSocket';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';

const ICON_MAP = {
  booking_confirmed:  { Icon: CheckCircle, color: '#16a34a' },
  booking_cancelled:  { Icon: XCircle,     color: '#dc2626' },
  flight_delay:       { Icon: Clock,       color: '#d97706' },
  flight_cancelled:   { Icon: XCircle,     color: '#dc2626' },
  payment_success:    { Icon: CreditCard,  color: '#16a34a' },
  payment_failed:     { Icon: AlertCircle, color: '#dc2626' },
  check_in_reminder:  { Icon: Bell,        color: '#2563eb' },
  refund_processed:   { Icon: RefreshCw,   color: '#2563eb' },
  general:            { Icon: Bell,        color: '#6b7280' },
};

const RealTimeNotifications = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { socket, joinUserRoom } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    joinUserRoom(user.id);
  }, [isAuthenticated, user?.id, joinUserRoom]);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification) => {
      // Persist in store
      addNotification({
        ...notification,
        id: notification._id || String(Date.now()),
        read: false,
        createdAt: notification.createdAt || new Date().toISOString(),
      });

      const { Icon, color } = ICON_MAP[notification.type] || ICON_MAP.general;
      const truncated =
        notification.message?.length > 60
          ? notification.message.slice(0, 57) + '…'
          : notification.message;

      const bookingId = notification.data?.bookingId;

      toast.custom(
        (t) => (
          <div
            className={`flex items-start gap-3 bg-white border border-gray-200 shadow-lg rounded-xl p-3.5 max-w-sm w-full transition-all duration-300 ${
              t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}18` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{notification.title}</p>
              {truncated && <p className="text-xs text-gray-500 mt-0.5 leading-snug">{truncated}</p>}
            </div>
            {bookingId && (
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  navigate(`/dashboard/bookings/${bookingId}`);
                }}
                className="text-xs text-primary-600 font-semibold shrink-0 hover:underline"
              >
                View
              </button>
            )}
          </div>
        ),
        { duration: 5000, position: 'top-right' }
      );
    };

    socket.on('notification:new', handleNotification);
    return () => socket.off('notification:new', handleNotification);
  }, [socket, addNotification, navigate]);

  return null; // purely side-effect component
};

export default RealTimeNotifications;
