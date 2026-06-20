import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Ticket, Plane, Users, IndianRupee,
  AlertTriangle, RefreshCw, CheckCircle,
} from 'lucide-react';
import { adminApi } from '../../api/axios';

const PERIOD_OPTIONS = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
];

const STATUS_COLORS = {
  confirmed: '#22c55e',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  completed: '#3b82f6',
  'no-show': '#6b7280',
};

function statusBadgeClass(status) {
  const map = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    'no-show': 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

function SkeletonBlock({ className }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <SkeletonBlock className="h-8 w-40 mb-2" />
          <SkeletonBlock className="h-4 w-60" />
        </div>
        <SkeletonBlock className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-5">
            <SkeletonBlock className="h-12 w-12 rounded-xl mb-3" />
            <SkeletonBlock className="h-3 w-28 mb-2" />
            <SkeletonBlock className="h-7 w-20 mb-2" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
          <SkeletonBlock className="h-5 w-48 mb-4" />
          <SkeletonBlock className="h-56 w-full" />
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <SkeletonBlock className="h-5 w-36 mb-4" />
          <SkeletonBlock className="h-44 w-full rounded-full" />
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {[0, 1].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-card p-5">
            <SkeletonBlock className="h-5 w-36 mb-4" />
            {[0, 1, 2, 3, 4].map(j => (
              <SkeletonBlock key={j} className="h-10 w-full mb-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState({ revenueByDay: [], bookingsByDay: [] });
  const [routes, setRoutes] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [revPeriod, setRevPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, revRes, routesRes, bookingsRes, usersRes] = await Promise.all([
          adminApi.get('/stats'),
          adminApi.get(`/revenue?period=${revPeriod}`),
          adminApi.get('/popular-routes'),
          adminApi.get('/recent-bookings'),
          adminApi.get('/recent-users'),
        ]);
        setStats(statsRes.data.data);
        setRevenue(revRes.data.data || { revenueByDay: [], bookingsByDay: [] });
        setRoutes(routesRes.data.data?.routes || []);
        setRecentBookings(bookingsRes.data.data?.bookings || []);
        setRecentUsers(usersRes.data.data?.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [revPeriod]);

  if (loading) return <LoadingSkeleton />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const kpiCards = [
    {
      label: 'Revenue (This Month)',
      value: `₹${(stats?.revenue?.thisMonth || 0).toLocaleString('en-IN')}`,
      change: stats?.revenue?.change,
      icon: IndianRupee,
      iconBg: 'bg-green-100 text-green-600',
    },
    {
      label: 'Bookings (This Month)',
      value: (stats?.bookings?.thisMonth || 0).toLocaleString(),
      change: stats?.bookings?.change,
      icon: Ticket,
      iconBg: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'Active Flights (Today)',
      value: stats?.flights?.today || 0,
      icon: Plane,
      iconBg: 'bg-blue-100 text-blue-600',
      sub: stats?.flights?.delayed
        ? `${stats.flights.delayed} delayed${stats.flights.cancelled ? `, ${stats.flights.cancelled} cancelled` : ''}`
        : null,
    },
    {
      label: 'Registered Users',
      value: (stats?.users?.total || 0).toLocaleString(),
      icon: Users,
      iconBg: 'bg-purple-100 text-purple-600',
      sub: stats?.users?.newThisWeek ? `+${stats.users.newThisWeek} this week` : null,
    },
  ];

  const revenueChartData = (revenue.revenueByDay || []).map(d => ({
    date: format(new Date(d._id), 'MMM dd'),
    revenue: d.revenue,
  }));

  const pieData = Object.entries(stats?.bookingsByStatus || {}).map(([status, count]) => ({
    name: status,
    value: count,
    color: STATUS_COLORS[status] || '#9ca3af',
  }));

  const periodLabel = PERIOD_OPTIONS.find(p => p.value === revPeriod)?.label || '30D';

  const hasAlerts =
    (stats?.flights?.delayed || 0) > 0 ||
    (stats?.flights?.cancelled || 0) > 0 ||
    (stats?.bookings?.pendingRefunds || 0) > 0;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {greeting}, Admin · {format(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map(({ label, value, change, icon: Icon, iconBg, sub }) => (
          <div key={label} className="bg-white rounded-2xl shadow-card p-5">
            <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-tight">{label}</p>
            <p className="text-2xl font-bold text-navy-800 mt-1">{value}</p>
            {change !== undefined && change !== null ? (
              <span className={`flex items-center gap-1 text-xs font-medium mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {change >= 0
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />}
                {Math.abs(change)}% from last month
              </span>
            ) : sub ? (
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
            ) : null}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Revenue (Last {periodLabel})</h2>
            <div className="flex items-center gap-1">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRevPeriod(opt.value)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                    revPeriod === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
                  width={55}
                />
                <Tooltip
                  formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
              No revenue data for this period
            </div>
          )}
        </div>

        {/* Booking Status Pie Chart */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Booking Status</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => [v, name]}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="text-gray-600 capitalize">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
              No booking data
            </div>
          )}
        </div>
      </div>

      {/* Popular Routes + Recent Bookings */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Popular Routes */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Popular Routes</h2>
            <Link
              to="/admin/flights"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View All →
            </Link>
          </div>
          {routes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium w-6">#</th>
                    <th className="text-left pb-2 font-medium">Route</th>
                    <th className="text-right pb-2 font-medium">Bookings</th>
                    <th className="text-right pb-2 font-medium">Revenue</th>
                    <th className="text-right pb-2 font-medium">Avg Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {routes.map((r, i) => (
                    <tr key={i} className="text-sm">
                      <td className="py-2.5 pr-2 font-bold text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-2.5 font-semibold text-gray-800">
                        {r.originCode} → {r.destCode}
                      </td>
                      <td className="py-2.5 text-right text-gray-600">{r.bookings}</td>
                      <td className="py-2.5 text-right text-gray-600">
                        ₹{(r.revenue || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right text-gray-600">
                        ₹{Math.round(r.avgPrice || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No route data available</p>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Recent Bookings</h2>
            <Link
              to="/admin/bookings"
              className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View All →
            </Link>
          </div>
          {recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Ref</th>
                    <th className="text-left pb-2 font-medium">Passenger</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                    <th className="text-right pb-2 font-medium">Status</th>
                    <th className="text-right pb-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map(b => (
                    <tr key={b._id} className="text-sm">
                      <td className="py-2.5 pr-2 font-mono text-xs text-gray-700 font-medium">
                        {b.bookingReference}
                      </td>
                      <td className="py-2.5 text-gray-700 max-w-[80px] truncate">
                        {b.passengers?.[0]?.name || b.user?.name || '—'}
                      </td>
                      <td className="py-2.5 text-right text-gray-700">
                        ₹{(b.pricing?.totalAmount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-xs text-gray-400 whitespace-nowrap">
                        {b.createdAt
                          ? formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No recent bookings</p>
          )}
        </div>
      </div>

      {/* Recent Users + Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Sign-ups */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Sign-ups</h2>
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.slice(0, 5).map(u => {
                const initials = u.name
                  ? u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                  : '?';
                return (
                  <div key={u._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {u.createdAt
                        ? `Joined ${formatDistanceToNow(new Date(u.createdAt))} ago`
                        : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No recent sign-ups</p>
          )}
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">System Alerts</h2>
          {hasAlerts ? (
            <div className="space-y-3">
              {(stats?.flights?.delayed || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-700 font-medium">
                    {stats.flights.delayed} flight{stats.flights.delayed > 1 ? 's' : ''} delayed today
                  </p>
                </div>
              )}
              {(stats?.flights?.cancelled || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700 font-medium">
                    {stats.flights.cancelled} flight{stats.flights.cancelled > 1 ? 's' : ''} cancelled today
                  </p>
                </div>
              )}
              {(stats?.bookings?.pendingRefunds || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-yellow-700 font-medium">
                    {stats.bookings.pendingRefunds} pending refund{stats.bookings.pendingRefunds > 1 ? 's' : ''} to process
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-sm text-green-700 font-medium">All systems normal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
