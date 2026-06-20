import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Calendar, Plane, CreditCard, TrendingUp, Search, List, User as UserIcon, Headphones,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { bookingApi } from '../../api/axios';
import { useNotificationStore } from '../../store/useNotificationStore';

const STATUS_STYLES = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-600',
};

const BOOKING_EVENTS = new Set(['payment_success', 'booking_confirmed', 'booking_cancelled', 'booking_updated']);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifications } = useNotificationStore();
  const debounceRef = useRef(null);

  const fetchBookings = useCallback(() => {
    bookingApi.get('/').then(r => {
      setBookings(r.data.data?.bookings || r.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Watch notification store — re-fetch bookings when a booking-related notification arrives
  const latestNotification = notifications[0];
  useEffect(() => {
    if (!latestNotification) return;
    if (!BOOKING_EVENTS.has(latestNotification.type)) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchBookings, 1500);
    return () => clearTimeout(debounceRef.current);
  }, [latestNotification, fetchBookings]);

  const now = new Date();
  const upcomingBookings = bookings.filter(b =>
    b.status === 'confirmed' && b.flight?.departureTime && isAfter(new Date(b.flight.departureTime), now)
  );
  const totalSpent = bookings
    .filter(b => b.payment?.status === 'completed')
    .reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);
  const milesEarned = Math.floor(totalSpent / 10);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const firstName = user?.name?.split(' ')[0] || 'Traveller';

  const recentBookings = bookings.slice(0, 5);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = format(d, 'MMM');
    const count = bookings.filter(b => {
      const bDate = new Date(b.createdAt);
      return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
    }).length;
    return { month: label, bookings: count };
  });

  const mostVisitedCity = (() => {
    const cities = bookings.map(b => b.flight?.destination?.city).filter(Boolean);
    if (!cities.length) return null;
    const freq = cities.reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {});
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  })();

  const preferredClass = (() => {
    const classes = bookings.map(b => b.class).filter(Boolean);
    if (!classes.length) return null;
    const freq = classes.reduce((acc, c) => ({ ...acc, [c]: (acc[c] || 0) + 1 }), {});
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  })();

  const quickActions = [
    { icon: Search, label: 'Search Flights', to: '/search', color: 'text-primary-600 bg-primary-50' },
    { icon: List, label: 'My Bookings', to: '/dashboard/bookings', color: 'text-green-600 bg-green-50' },
    { icon: UserIcon, label: 'Edit Profile', to: '/dashboard/profile', color: 'text-amber-600 bg-amber-50' },
    { icon: Headphones, label: 'Get Support', to: '/dashboard/notifications', color: 'text-purple-600 bg-purple-50' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
        <div className="card p-5 h-48 animate-pulse bg-gray-100" />
        <div className="card p-5 h-32 animate-pulse bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">✈ {greeting}, {firstName}!</h1>
        <p className="text-gray-500 mt-0.5">Ready for your next adventure?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Bookings</p>
            <p className="text-2xl font-bold text-navy-900">{bookings.length}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-primary-50 border-primary-100">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
            <Plane className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Upcoming Flights</p>
            <p className="text-2xl font-bold text-navy-900">{upcomingBookings.length}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-success-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold text-navy-900">₹{totalSpent.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Miles Earned</p>
            <p className="text-2xl font-bold text-navy-900">{milesEarned.toLocaleString()} mi</p>
          </div>
        </div>
      </div>

      {/* Upcoming Flights */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-navy-900">Upcoming Flights</h2>
          <Link to="/dashboard/bookings" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Plane className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No upcoming flights. Ready to explore?</p>
            <Link to="/search" className="mt-3 btn-primary text-sm px-4 py-2">
              Search Flights
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map(b => (
              <div key={b._id} className="card p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-navy-900">{b.flight?.airline?.name || 'Airline'}</p>
                  <p className="text-xs text-gray-400">{b.flight?.flightNumber || '—'}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>{b.flight?.origin?.code || '—'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span>{b.flight?.destination?.code || '—'}</span>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-500">
                    {b.flight?.departureTime ? format(new Date(b.flight.departureTime), 'dd MMM, HH:mm') : '—'}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{b.class || '—'}</p>
                </div>
                <Link
                  to={`/dashboard/bookings/${b._id}`}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-navy-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(({ icon: Icon, label, to, color }) => (
            <Link
              key={to + label}
              to={to}
              className="card p-5 flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-navy-900">Recent Bookings</h2>
          <Link to="/dashboard/bookings" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Ref</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Route</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Date</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Class</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Amount</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="py-2 px-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map(b => (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-gray-500">
                      {b.bookingReference || b._id?.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-2 font-medium text-navy-900">
                      {b.flight?.origin?.code || '—'} → {b.flight?.destination?.code || '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-500 hidden sm:table-cell">
                      {b.flight?.departureTime
                        ? format(new Date(b.flight.departureTime), 'dd MMM yyyy')
                        : '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-500 capitalize hidden md:table-cell">{b.class || '—'}</td>
                    <td className="py-3 px-2 text-gray-700 hidden md:table-cell">
                      {b.pricing?.totalAmount != null ? `₹${b.pricing.totalAmount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-600'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Link
                        to={`/dashboard/bookings/${b._id}`}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Travel Insights */}
      {bookings.length >= 2 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-navy-900 mb-4">Your Travel Stats</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 mt-4">
            {mostVisitedCity && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Most Visited City</p>
                <p className="text-sm font-semibold text-navy-900 mt-0.5">{mostVisitedCity}</p>
              </div>
            )}
            {preferredClass && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">Preferred Class</p>
                <p className="text-sm font-semibold text-navy-900 mt-0.5 capitalize">{preferredClass}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
