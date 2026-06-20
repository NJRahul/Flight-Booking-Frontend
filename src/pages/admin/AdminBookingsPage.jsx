import { useEffect, useState, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Search, Download, Filter, ChevronLeft, ChevronRight, X,
  Eye, RefreshCw, Mail, AlertCircle, CreditCard, Plane,
} from 'lucide-react';
import { adminApi } from '../../api/axios';
import toast from 'react-hot-toast';

const bookingStatusColors = {
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-gray-50 text-gray-600 border-gray-200',
};

const paymentStatusColors = {
  completed: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  refunded: 'bg-blue-50 text-blue-700',
  failed: 'bg-red-50 text-red-700',
};

function StatCard({ label, value }) {
  return (
    <div className="card p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SkeletonRows({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: 9 }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded-lg" />
        </td>
      ))}
    </tr>
  ));
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [todayStats, setTodayStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const [drawer, setDrawer] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterPayment) params.paymentStatus = filterPayment;
      const r = await adminApi.get('/bookings', { params });
      setBookings(r.data.data?.bookings || []);
      setTotal(r.data.data?.total || 0);
      setTodayStats(r.data.data?.todayStats || {});
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterPayment]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const exportCSV = () => {
    const headers = ['Ref', 'Passenger', 'Email', 'Route', 'Date', 'Class', 'Amount', 'Status', 'Payment', 'Created'];
    const rows = bookings.map(b => [
      b.bookingReference,
      b.passengers?.[0] ? `${b.passengers[0].firstName} ${b.passengers[0].lastName}` : '',
      b.contactInfo?.email || '',
      `${b.flight?.origin?.code} → ${b.flight?.destination?.code}`,
      b.flight?.departureTime ? format(new Date(b.flight.departureTime), 'dd/MM/yyyy') : '',
      b.class,
      b.pricing?.totalAmount,
      b.status,
      b.payment?.status,
      format(new Date(b.createdAt), 'dd/MM/yyyy HH:mm'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    setProcessingRefund(true);
    try {
      await adminApi.post(`/bookings/${refundModal._id}/refund`, {
        amount: parseFloat(refundAmount),
        reason: refundReason,
      });
      toast.success('Refund processed');
      setRefundModal(null);
      fetchBookings();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Refund failed');
    } finally {
      setProcessingRefund(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterPayment('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} bookings total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBookings}
            className="btn-secondary !px-3"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="btn-secondary">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Today's Bookings" value={todayStats.bookings || 0} />
        <StatCard label="Today's Revenue" value={`₹${(todayStats.revenue || 0).toLocaleString('en-IN')}`} />
        <StatCard label="Pending Refunds" value={todayStats.pendingRefunds || 0} />
        <StatCard label="Cancellations Today" value={todayStats.cancellations || 0} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Ref, passenger name, email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="select-field w-auto min-w-[150px]"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="select-field w-auto min-w-[150px]"
          value={filterPayment}
          onChange={e => { setFilterPayment(e.target.value); setPage(1); }}
        >
          <option value="">All payments</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>

        {(search || filterStatus || filterPayment) && (
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Booking Ref</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Passenger</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Route &amp; Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Class</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRows count={8} />
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <Plane className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No bookings found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                bookings.map(b => {
                  const firstName = b.passengers?.[0]?.firstName || '';
                  const lastName = b.passengers?.[0]?.lastName || '';
                  const passengerName = [firstName, lastName].filter(Boolean).join(' ') || '—';
                  const extraPassengers = (b.passengers?.length || 1) - 1;
                  const isRefundable = b.payment?.status === 'completed' && b.status !== 'cancelled';

                  return (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-primary-600">{b.bookingReference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{passengerName}</p>
                        {extraPassengers > 0 && (
                          <p className="text-xs text-gray-400">+{extraPassengers} more</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold whitespace-nowrap">
                          {b.flight?.origin?.code} → {b.flight?.destination?.code}
                        </p>
                        {b.flight?.departureTime && (
                          <p className="text-xs text-gray-400">
                            {format(new Date(b.flight.departureTime), 'dd MMM yyyy')}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium capitalize">
                          {b.class}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-800">
                          ₹{b.pricing?.totalAmount?.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${paymentStatusColors[b.payment?.status] || 'bg-gray-50 text-gray-600'}`}>
                          {b.payment?.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${bookingStatusColors[b.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500">
                          {b.createdAt ? formatDistanceToNow(new Date(b.createdAt), { addSuffix: true }) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDrawer(b)}
                            title="View details"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isRefundable && (
                            <button
                              onClick={() => { setRefundModal(b); setRefundAmount(''); setRefundReason(''); }}
                              title="Process refund"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            title="Send email"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                            onClick={() => toast.success('Email queued for ' + (b.contactInfo?.email || 'passenger'))}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-1">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── BOOKING DETAIL DRAWER ── */}
      {/* Overlay */}
      {drawer && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setDrawer(null)}
        />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          drawer ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {drawer && (
          <>
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setDrawer(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Ref + Status */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Booking Reference</p>
                  <p className="font-mono text-xl font-bold text-gray-900">{drawer.bookingReference}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border capitalize flex-shrink-0 ${bookingStatusColors[drawer.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {drawer.status}
                </span>
              </div>

              {/* Flight Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Flight</p>
                <p className="font-semibold text-gray-800">{drawer.flight?.flightNumber} — {drawer.flight?.origin?.code} → {drawer.flight?.destination?.code}</p>
                <p className="text-sm text-gray-600">{drawer.flight?.origin?.city} → {drawer.flight?.destination?.city}</p>
                {drawer.flight?.departureTime && (
                  <p className="text-sm text-gray-500">{format(new Date(drawer.flight.departureTime), 'dd MMM yyyy HH:mm')}</p>
                )}
                <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-medium capitalize">{drawer.class} class</span>
              </div>

              {/* Passengers */}
              {drawer.passengers?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Passengers</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">#</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Seat</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Meal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {drawer.passengers.map((p, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium text-gray-800">{p.firstName} {p.lastName}</td>
                            <td className="px-3 py-2 capitalize text-gray-600">{p.type}</td>
                            <td className="px-3 py-2 text-gray-500 font-mono text-xs">{p.seatNumber || '—'}</td>
                            <td className="px-3 py-2 text-gray-500 capitalize text-xs">{p.mealPreference || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Contact */}
              {(drawer.contactInfo?.email || drawer.contactInfo?.phone) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                  <div className="space-y-1 text-sm">
                    {drawer.contactInfo?.email && <p className="text-gray-700">{drawer.contactInfo.email}</p>}
                    {drawer.contactInfo?.phone && <p className="text-gray-500">{drawer.contactInfo.phone}</p>}
                  </div>
                </div>
              )}

              {/* Pricing */}
              {drawer.pricing && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pricing</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                    {drawer.pricing.basePrice != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Base Price</span>
                        <span className="text-gray-800">₹{drawer.pricing.basePrice?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {drawer.pricing.taxes != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Taxes</span>
                        <span className="text-gray-800">₹{drawer.pricing.taxes?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {drawer.pricing.fees != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fees</span>
                        <span className="text-gray-800">₹{drawer.pricing.fees?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-primary-600">₹{drawer.pricing.totalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment */}
              {drawer.payment && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Method</span>
                      <span className="text-gray-800 capitalize">{drawer.payment.method || '—'}</span>
                    </div>
                    {drawer.payment.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Transaction ID</span>
                        <span className="font-mono text-xs text-gray-700">{drawer.payment.transactionId}</span>
                      </div>
                    )}
                    {drawer.payment.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Paid At</span>
                        <span className="text-gray-800">{format(new Date(drawer.payment.paidAt), 'dd MMM yyyy HH:mm')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${paymentStatusColors[drawer.payment.status] || 'bg-gray-50 text-gray-600'}`}>
                        {drawer.payment.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Info */}
              {drawer.status === 'cancelled' && drawer.cancellation && (
                <div className="bg-red-50 rounded-xl p-4 space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Cancellation</p>
                  {drawer.cancellation.cancelledAt && (
                    <div className="flex justify-between">
                      <span className="text-red-400">Date</span>
                      <span className="text-red-700">{format(new Date(drawer.cancellation.cancelledAt), 'dd MMM yyyy HH:mm')}</span>
                    </div>
                  )}
                  {drawer.cancellation.reason && (
                    <div className="flex justify-between">
                      <span className="text-red-400">Reason</span>
                      <span className="text-red-700">{drawer.cancellation.reason}</span>
                    </div>
                  )}
                  {drawer.cancellation.refundAmount != null && (
                    <div className="flex justify-between font-semibold">
                      <span className="text-red-400">Refund</span>
                      <span className="text-red-700">₹{drawer.cancellation.refundAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {drawer.payment?.status === 'completed' && drawer.status !== 'cancelled' && (
              <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => { setRefundModal(drawer); setRefundAmount(''); setRefundReason(''); setDrawer(null); }}
                  className="w-full bg-red-600 text-white rounded-xl py-2.5 font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Process Refund
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── REFUND MODAL ── */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Process Refund</h2>
              <button onClick={() => setRefundModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Booking: <span className="font-mono font-semibold text-gray-900">{refundModal.bookingReference}</span>
            </p>
            <p className="text-sm">
              Total paid:{' '}
              <strong className="text-gray-900">₹{refundModal.pricing?.totalAmount?.toLocaleString('en-IN')}</strong>
            </p>
            <div>
              <label className="label-text">Refund Amount (₹)</label>
              <input
                type="number"
                className="input-field"
                value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                placeholder={refundModal.pricing?.totalAmount}
                min="1"
                max={refundModal.pricing?.totalAmount}
              />
            </div>
            <div>
              <label className="label-text">Reason</label>
              <input
                type="text"
                className="input-field"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                placeholder="Reason for refund..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRefundModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={handleRefund}
                disabled={processingRefund || !refundAmount}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processingRefund ? 'Processing...' : 'Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
