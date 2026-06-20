import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter, isPast, differenceInHours } from 'date-fns';
import { Search, Download, X, ChevronDown, Plane, AlertTriangle } from 'lucide-react';
import { bookingApi } from '../../api/axios';
import toast from 'react-hot-toast';

const statusColors = {
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-gray-100 text-gray-700 border-gray-200',
  'no-show': 'bg-red-100 text-red-700 border-red-200',
};

const accentColors = {
  confirmed: 'bg-green-500',
  pending: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  completed: 'bg-gray-400',
  'no-show': 'bg-red-500',
};

const CANCEL_REASONS = [
  'Changed plans',
  'Health reasons',
  'Emergency',
  'Schedule conflict',
  'Found better option',
  'Other',
];

const FILTERS = ['all', 'upcoming', 'completed', 'cancelled', 'pending'];

const SkeletonCard = () => (
  <div className="card overflow-hidden flex animate-pulse">
    <div className="w-1 flex-shrink-0 bg-gray-200" />
    <div className="p-5 flex-1 space-y-3">
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-6 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-64 bg-gray-200 rounded" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
      </div>
    </div>
  </div>
);

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    bookingApi.get('/').then(r => {
      setBookings(r.data.data?.bookings || r.data.data || []);
    }).catch(() => toast.error('Failed to load bookings')).finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const filtered = bookings
    .filter(b => {
      if (filter === 'upcoming') return b.status === 'confirmed' && b.flight?.departureTime && isAfter(new Date(b.flight.departureTime), now);
      if (filter === 'completed') return b.status === 'completed' || (b.status === 'confirmed' && b.flight?.arrivalTime && isPast(new Date(b.flight.arrivalTime)));
      if (filter === 'cancelled') return b.status === 'cancelled';
      if (filter === 'pending') return b.payment?.status === 'pending' || b.status === 'pending';
      return true;
    })
    .filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.bookingReference?.toLowerCase().includes(q) ||
        b.flight?.origin?.city?.toLowerCase().includes(q) ||
        b.flight?.destination?.city?.toLowerCase().includes(q) ||
        b.flight?.origin?.code?.toLowerCase().includes(q) ||
        b.flight?.destination?.code?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOrder === 'amount-high') return (b.pricing?.totalAmount || 0) - (a.pricing?.totalAmount || 0);
      return 0;
    });

  const getRefundInfo = (booking) => {
    if (!booking.flight?.departureTime) return { pct: 0, amount: 0 };
    const hoursLeft = differenceInHours(new Date(booking.flight.departureTime), new Date());
    let pct = 0;
    if (hoursLeft > 24) pct = 90;
    else if (hoursLeft >= 12) pct = 50;
    const amount = Math.round((booking.pricing?.totalAmount || 0) * pct / 100);
    return { pct, amount };
  };

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason) {
      toast.error('Please select a reason');
      return;
    }
    setCancelling(true);
    try {
      const r = await bookingApi.put(`/${cancelModal._id}/cancel`, {
        reason: cancelReason,
        comments: cancelComments,
      });
      setBookings(prev =>
        prev.map(b =>
          b._id === cancelModal._id ? (r.data.data?.booking || { ...b, status: 'cancelled' }) : b
        )
      );
      toast.success('Booking cancelled successfully');
      setCancelModal(null);
      setCancelReason('');
      setCancelComments('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownload = async (bookingId, ref) => {
    try {
      const r = await bookingApi.get(`/${bookingId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ref}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const openCancelModal = (b) => {
    setCancelModal(b);
    setCancelReason('');
    setCancelComments('');
  };

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-navy-900">My Bookings</h1>
        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-sm rounded-full font-medium">
          {bookings.length} total
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input-field pl-9 py-2 text-sm w-full"
            placeholder="Search by ref or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="appearance-none input-field py-2 pr-8 text-sm cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount-high">Amount High-Low</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Plane className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No bookings found</h3>
          <p className="text-gray-400 text-sm mb-6">
            {searchQuery
              ? `No results for "${searchQuery}"`
              : filter !== 'all'
              ? `You have no ${filter} bookings`
              : "You haven't made any bookings yet"}
          </p>
          <Link to="/search" className="btn-primary px-6 py-2.5 text-sm">
            Search Flights
          </Link>
        </div>
      )}

      {/* Booking cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(b => {
            const depCity = b.flight?.origin?.city || b.flight?.origin?.code || '—';
            const arrCity = b.flight?.destination?.city || b.flight?.destination?.code || '—';
            const depTime = b.flight?.departureTime;
            const hoursUntilDep = depTime ? differenceInHours(new Date(depTime), new Date()) : 0;
            const canCancel = b.status === 'confirmed' && depTime && hoursUntilDep > 2;
            const accent = accentColors[b.status] || 'bg-gray-400';
            const statusColor = statusColors[b.status] || 'bg-gray-100 text-gray-700 border-gray-200';

            return (
              <div key={b._id} className="card overflow-hidden flex">
                <div className={`w-1 flex-shrink-0 ${accent}`} />
                <div className="p-5 flex-1">
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {b.bookingReference || b._id?.slice(-8).toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 border rounded-full text-xs font-semibold capitalize ${statusColor}`}>
                      {b.status}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-navy-900">{depCity}</span>
                    <Plane className="w-4 h-4 text-primary-500 rotate-90" />
                    <span className="text-lg font-bold text-navy-900">{arrCity}</span>
                  </div>

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                    {depTime && (
                      <span>{format(new Date(depTime), 'dd MMM yyyy, HH:mm')}</span>
                    )}
                    <span className="capitalize">{b.class || 'Economy'}</span>
                    <span>{b.passengers?.length || 1} passenger{(b.passengers?.length || 1) !== 1 ? 's' : ''}</span>
                    {b.pricing?.totalAmount != null && (
                      <span className="font-semibold text-navy-800">
                        ₹{b.pricing.totalAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Link
                      to={`/dashboard/bookings/${b._id}`}
                      className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </Link>

                    {(b.status === 'confirmed' || b.status === 'completed') && (
                      <button
                        onClick={() => handleDownload(b._id, b.bookingReference || b._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => openCancelModal(b)}
                        className="px-3 py-1.5 text-red-600 text-xs font-medium hover:underline transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}

                    {(b.payment?.status === 'pending' || b.status === 'pending') && (
                      <Link
                        to={`/payment/${b._id}`}
                        className="btn-primary px-3 py-1.5 text-xs"
                      >
                        Complete Payment
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <h2 className="text-lg font-bold text-navy-900">Cancel Booking?</h2>
              </div>
              <button
                onClick={() => setCancelModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Booking:{' '}
              <span className="font-mono font-semibold text-navy-900">
                {cancelModal.bookingReference}
              </span>
            </p>

            {(() => {
              const { pct, amount } = getRefundInfo(cancelModal);
              return pct > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                  <p className="font-semibold text-green-700">
                    Refund: ₹{amount.toLocaleString('en-IN')} ({pct}%)
                  </p>
                  <p className="text-green-600 text-xs mt-0.5">
                    Processed within 5-7 business days
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  <p className="font-semibold">No refund applicable</p>
                  <p className="text-xs mt-0.5">Cancellation within 12 hours of departure</p>
                </div>
              );
            })()}

            <div>
              <label className="label-text">Reason *</label>
              <select
                className="input-field mt-1"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              >
                <option value="">Select reason...</option>
                {CANCEL_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-text">Comments (optional)</label>
              <textarea
                className="input-field mt-1"
                rows={2}
                value={cancelComments}
                onChange={e => setCancelComments(e.target.value)}
                placeholder="Additional details..."
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setCancelModal(null)}
                className="flex-1 btn-secondary"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
