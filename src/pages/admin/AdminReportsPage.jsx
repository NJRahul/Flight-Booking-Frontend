import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Color Palettes ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  confirmed: '#22c55e',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  completed: '#3b82f6',
  'no-show': '#6b7280',
};
const CLASS_COLORS = {
  economy: '#4F46E5',
  business: '#f59e0b',
  first: '#8b5cf6',
};
const PAYMENT_COLORS = ['#4F46E5', '#22c55e', '#f59e0b', '#6b7280', '#ef4444'];
const AIRLINE_COLORS = ['#4F46E5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => { try { return format(new Date(d), 'MMM dd'); } catch { return d; } };
const fmtRevenue = (v) => `₹${(v / 1000).toFixed(1)}k`;
const fmtINR = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return <h2 className="text-base font-bold text-gray-800 mb-1">{children}</h2>;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-gray-400">
      <RefreshCw className="w-8 h-8 animate-spin text-primary-400" />
      <p className="text-sm font-medium">Loading reports...</p>
    </div>
  );
}

// ─── Empty Legend for Pie/Donut ───────────────────────────────────────────────
function MiniLegend({ items, colorMap }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: colorMap ? colorMap[item.name] || '#9ca3af' : PAYMENT_COLORS[i % PAYMENT_COLORS.length] }}
          />
          <span className="capitalize">{item.name}</span>
          <span className="text-gray-400">({item.value})</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const r = await adminApi.get(`/reports?period=${period}`);
      setData(r.data.data);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chart data transforms ──────────────────────────────────────────────────
  const revenueChartData = (data?.revenueByDay || []).map(d => ({
    date: fmtDate(d._id),
    revenue: d.revenue,
    bookings: d.count,
  }));
  const bookingsChartData = (data?.bookingsByDay || []).map(d => ({
    date: fmtDate(d._id),
    bookings: d.count,
  }));
  const statusChartData = (data?.byStatus || []).map(d => ({
    name: d._id,
    value: d.count,
  }));
  const classChartData = (data?.byClass || []).map(d => ({
    name: d._id,
    value: d.count,
    revenue: d.revenue,
  }));
  const paymentChartData = (data?.byPaymentMethod || []).map(d => ({
    name: d._id || 'Unknown',
    value: d.count,
  }));
  const airlineChartData = (data?.revenueByAirline || []).map(d => ({
    name: d._id,
    revenue: d.revenue,
    bookings: d.count,
  }));
  const signupChartData = (data?.userSignupsByDay || []).map(d => ({
    date: fmtDate(d._id),
    users: d.count,
  }));
  const refundChartData = (data?.refundsByDay || []).map(d => ({
    date: fmtDate(d._id),
    amount: d.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 font-display">Reports &amp; Analytics</h1>

      {/* Period switcher */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { v: '7d', label: 'Last 7 Days' },
          { v: '30d', label: 'Last 30 Days' },
          { v: '3m', label: 'Last 3 Months' },
          { v: '1y', label: 'Last Year' },
        ].map(({ v, label }) => (
          <button
            key={v}
            onClick={() => setPeriod(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              period === v
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={fetchReports}
          className="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : data === null ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-base font-medium">No data available for the selected period.</p>
        </div>
      ) : (
        <>
          {/* ── SECTION 1: Revenue Analytics ─────────────────────────────── */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Revenue by Day — area chart */}
            <div className="lg:col-span-2 card p-5">
              <SectionTitle>Revenue by Day</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChartData}>
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
                    tickFormatter={fmtRevenue}
                  />
                  <Tooltip formatter={(v) => [fmtINR(v), 'Revenue']} />
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
            </div>

            {/* Revenue by Airline — pie */}
            <div className="card p-5">
              <SectionTitle>Revenue by Airline</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={airlineChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="revenue"
                    nameKey="name"
                  >
                    {airlineChartData.map((_, i) => (
                      <Cell key={i} fill={AIRLINE_COLORS[i % AIRLINE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmtINR(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── SECTION 2: Booking Trends ─────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Bookings by Day — bar chart */}
            <div className="card p-5">
              <SectionTitle>Bookings by Day</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bookingsChartData}>
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
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#4F46E5" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Status + By Class — two donuts side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* By Status */}
              <div className="card p-4">
                <SectionTitle>By Status</SectionTitle>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="value"
                    >
                      {statusChartData.map((d, i) => (
                        <Cell key={i} fill={STATUS_COLORS[d.name] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <MiniLegend items={statusChartData} colorMap={STATUS_COLORS} />
              </div>

              {/* By Class */}
              <div className="card p-4">
                <SectionTitle>By Class</SectionTitle>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={classChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      dataKey="value"
                    >
                      {classChartData.map((d, i) => (
                        <Cell key={i} fill={CLASS_COLORS[d.name] || PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <MiniLegend items={classChartData} colorMap={CLASS_COLORS} />
              </div>
            </div>
          </div>

          {/* ── SECTION 3: Route Performance ─────────────────────────────── */}
          <div className="card p-5">
            <SectionTitle>Revenue by Airline (Horizontal)</SectionTitle>
            <ResponsiveContainer
              width="100%"
              height={Math.max(150, airlineChartData.length * 40)}
            >
              <BarChart data={airlineChartData} layout="vertical">
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={fmtRevenue}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip formatter={(v) => fmtINR(v)} />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── SECTION 4: User Analytics ─────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Sign-ups by day */}
            <div className="card p-5">
              <SectionTitle>User Sign-ups by Day</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={signupChartData}>
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
                    allowDecimals={false}
                  />
                  <Tooltip />
                  <Bar dataKey="users" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top users by bookings */}
            <div className="card p-5">
              <SectionTitle>Top Users by Bookings</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      {['#', 'Name', 'Email', 'Bookings', 'Spent'].map(h => (
                        <th key={h} className="pb-2 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.topUsers || []).slice(0, 8).map((u, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2 font-medium text-gray-900">{u.name}</td>
                        <td className="py-2 text-gray-500 text-xs">{u.email}</td>
                        <td className="py-2 text-center text-gray-700">{u.count}</td>
                        <td className="py-2 text-right font-medium text-gray-900">
                          {fmtINR(u.spent)}
                        </td>
                      </tr>
                    ))}
                    {(data?.topUsers || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                          No user data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── SECTION 5: Payment Analytics ─────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Payment methods — donut */}
            <div className="card p-5">
              <SectionTitle>Payment Methods</SectionTitle>
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {paymentChartData.map((_, i) => (
                        <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Refunds by day — line chart */}
            <div className="card p-5">
              <SectionTitle>Refunds by Day</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={refundChartData}>
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
                    tickFormatter={fmtRevenue}
                  />
                  <Tooltip formatter={(v) => [fmtINR(v), 'Refunded']} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
