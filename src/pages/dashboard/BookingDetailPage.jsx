import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, differenceInHours } from 'date-fns';
import {
  ArrowLeft, CheckCircle, Clock, XCircle, Download, Share2, Plane,
  Users, CreditCard, Package, AlertTriangle, X,
} from 'lucide-react';
import { bookingApi } from '../../api/axios';
import toast from 'react-hot-toast';

const statusBanner = {
  confirmed: { bg: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle, text: 'Your booking is confirmed' },
  pending: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-800', Icon: Clock, text: 'Payment pending — complete payment to confirm' },
  cancelled: { bg: 'bg-red-50 border-red-200 text-red-800', Icon: XCircle, text: 'This booking has been cancelled' },
  completed: { bg: 'bg-gray-50 border-gray-200 text-gray-700', Icon: CheckCircle, text: 'Trip completed' },
};

const CANCEL_REASONS = [
  'Changed plans',
  'Health reasons',
  'Emergency',
  'Schedule conflict',
  'Found better option',
  'Other',
];

const EXTRAS_META = {
  extraBaggage: { label: 'Extra Baggage', price: 1299 },
  travelInsurance: { label: 'Travel Insurance', price: 499 },
  mealUpgrade: { label: 'Meal Upgrade', price: 299 },
  priorityBoarding: { label: 'Priority Boarding', price: 199 },
};

const fmt = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? format(new Date(d), 'dd MMM yyyy') : '—';
const fmtDateTime = (d) => d ? format(new Date(d), 'dd MMM yyyy, HH:mm') : '—';
const maskPassport = (p) => p ? `•••••${p.slice(-4)}` : '—';

const getTimeline = (b) => {
  const dep = b.flight?.departureTime;
  const arr = b.flight?.arrivalTime;
  return [
    { label: 'Booking Created', time: b.createdAt, done: true },
    { label: 'Payment Received', time: b.payment?.paidAt, done: !!b.payment?.paidAt },
    { label: 'Booking Confirmed', time: b.payment?.paidAt, done: b.status === 'confirmed' || b.status === 'completed' },
    {
      label: 'Check-in Opens',
      time: dep ? new Date(new Date(dep).getTime() - 48 * 3600000).toISOString() : null,
      done: !!dep && new Date() > new Date(new Date(dep).getTime() - 48 * 3600000),
    },
    { label: 'Departure', time: dep, done: !!dep && new Date() > new Date(dep) },
    { label: 'Arrival', time: arr, done: !!arr && new Date() > new Date(arr) },
  ];
};

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelComments, setCancelComments] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    bookingApi.get(`/${id}`).then(r => {
      setBooking(r.data.data?.booking || r.data.data);
    }).catch(() => toast.error('Failed to load booking')).finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!booking) return;
    try {
      const r = await bookingApi.get(`/${booking._id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${booking.bookingReference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const handleCancel = async () => {
    if (!cancelReason) { toast.error('Please select a reason'); return; }
    setCancelling(true);
    try {
      const r = await bookingApi.put(`/${booking._id}/cancel`, {
        reason: cancelReason,
        comments: cancelComments,
      });
      setBooking(r.data.data?.booking || { ...booking, status: 'cancelled' });
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      setCancelReason('');
      setCancelComments('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Plane className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-navy-900 mb-2">Booking not found</h2>
        <p className="text-gray-500 mb-6 text-sm">This booking may have been removed or you don't have access.</p>
        <Link to="/dashboard/bookings" className="btn-primary px-6 py-2.5 text-sm">
          Back to My Bookings
        </Link>
      </div>
    );
  }

  const banner = statusBanner[booking.status] || statusBanner.completed;
  const BannerIcon = banner.Icon;
  const dep = booking.flight?.departureTime;
  const hoursUntilDep = dep ? differenceInHours(new Date(dep), new Date()) : 0;
  const canCancel = booking.status === 'confirmed' && dep && hoursUntilDep > 2;
  const timeline = getTimeline(booking);
  const selectedExtras = Object.entries(booking.extras || {}).filter(([, val]) => val);
  const paymentMethodLabel = {
    card: 'Credit / Debit Card',
    upi: 'UPI',
    netbanking: 'Net Banking',
    wallet: 'Wallet',
  };

  return (
    <div className="w-full space-y-5">
      {/* Back */}
      <Link
        to="/dashboard/bookings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy-900 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Bookings
      </Link>

      {/* Status Banner */}
      <div className={`border rounded-xl p-4 flex items-center gap-3 ${banner.bg}`}>
        <BannerIcon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-semibold">{banner.text}</span>
        {booking.status === 'pending' && (
          <Link to={`/payment/${booking._id}`} className="ml-auto btn-primary text-xs px-4 py-1.5">
            Complete Payment
          </Link>
        )}
      </div>

      {/* Main Grid */}
      <div className="lg:grid lg:grid-cols-3 gap-6 space-y-5 lg:space-y-0">
        {/* Left: 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          {/* Booking Details Card */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Booking Reference</p>
                <p className="text-2xl font-mono font-bold text-navy-900 tracking-wider">
                  {booking.bookingReference}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {booking.flight?.airline?.name || 'Airline'} &bull; {booking.flight?.flightNumber} &bull;{' '}
                  <span className="capitalize">{booking.class}</span>
                </p>
              </div>
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 flex-shrink-0 text-center">
                QR Code
              </div>
            </div>

            {/* Route Visual */}
            <div className="flex items-center gap-4 my-5 p-4 bg-gray-50 rounded-xl">
              <div className="text-center min-w-0">
                <p className="text-2xl font-bold text-navy-900">
                  {booking.flight?.origin?.code || '—'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {booking.flight?.origin?.city || '—'}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">
                  {fmtDateTime(booking.flight?.departureTime)}
                </p>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center w-full">
                  <div className="flex-1 h-px bg-gray-300" />
                  <Plane className="w-4 h-4 text-primary-600 mx-2 rotate-90" />
                  <div className="flex-1 h-px bg-gray-300" />
                </div>
                <p className="text-xs text-gray-400 mt-1.5 capitalize">{booking.class} class</p>
              </div>

              <div className="text-center min-w-0">
                <p className="text-2xl font-bold text-navy-900">
                  {booking.flight?.destination?.code || '—'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {booking.flight?.destination?.city || '—'}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">
                  {fmtDateTime(booking.flight?.arrivalTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Passengers */}
          {booking.passengers?.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary-600" />
                <h2 className="text-base font-semibold text-navy-900">Passengers</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['#', 'Name', 'Type', 'Passport', 'Seat', 'Meal'].map(h => (
                        <th key={h} className="text-left py-2 px-2 text-xs font-medium text-gray-400 uppercase whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {booking.passengers.map((p, i) => (
                      <tr key={p._id || i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="py-2.5 px-2 font-medium text-navy-900 whitespace-nowrap">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                            {p.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-xs text-gray-500">
                          {maskPassport(p.passportNumber)}
                        </td>
                        <td className="py-2.5 px-2 text-gray-600">{p.seatNumber || '—'}</td>
                        <td className="py-2.5 px-2 text-gray-600 capitalize text-xs whitespace-nowrap">
                          {p.mealPreference || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-navy-900 mb-4">Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">Email</p>
                <p className="text-gray-700">{booking.contactInfo?.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">Phone</p>
                <p className="text-gray-700">{booking.contactInfo?.phone || '—'}</p>
              </div>
              {booking.contactInfo?.emergencyContact?.name && (
                <div className="sm:col-span-2 border-t border-gray-100 pt-3 mt-1">
                  <p className="text-xs text-gray-400 uppercase font-medium mb-2">Emergency Contact</p>
                  <div className="flex gap-6 text-sm">
                    <span className="text-gray-700">{booking.contactInfo.emergencyContact.name}</span>
                    <span className="text-gray-500">{booking.contactInfo.emergencyContact.phone || '—'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extras */}
          {selectedExtras.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-primary-600" />
                <h2 className="text-base font-semibold text-navy-900">Extras</h2>
              </div>
              <div className="space-y-2">
                {selectedExtras.map(([key]) => {
                  const meta = EXTRAS_META[key];
                  if (!meta) return null;
                  return (
                    <div key={key} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{meta.label}</span>
                      </div>
                      <span className="font-medium text-navy-800">{fmt(meta.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card p-5">
            <h2 className="text-base font-semibold text-navy-900 mb-5">Booking Timeline</h2>
            <div className="space-y-0">
              {timeline.map((step, i) => {
                const isLast = i === timeline.length - 1;
                const isDone = step.done;
                const isCurrent = !isDone && i > 0 && timeline[i - 1]?.done;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-primary-500 animate-pulse'
                          : 'bg-gray-200 border-2 border-gray-300'
                      }`} />
                      {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                      <p className={`text-sm font-medium ${isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(step.time)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: 1 col */}
        <div className="lg:col-span-1 space-y-5">
          {/* Payment Info */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-primary-600" />
              <h2 className="text-base font-semibold text-navy-900">Payment Information</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-700 capitalize">
                  {paymentMethodLabel[booking.payment?.method] || booking.payment?.method || '—'}
                </span>
              </div>
              {booking.payment?.transactionId && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">Transaction</span>
                  <span className="font-mono text-xs text-gray-600 text-right break-all">
                    {booking.payment.transactionId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-700">{fmtDate(booking.payment?.paidAt)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Base Price</span>
                    <span>{fmt(booking.pricing?.basePrice || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes</span>
                    <span>{fmt(booking.pricing?.taxes || 0)}</span>
                  </div>
                  {(booking.pricing?.fees || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Fees</span>
                      <span>{fmt(booking.pricing.fees)}</span>
                    </div>
                  )}
                  {(booking.pricing?.extras || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Extras</span>
                      <span>{fmt(booking.pricing.extras)}</span>
                    </div>
                  )}
                  {(booking.pricing?.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{fmt(booking.pricing.discount)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
                  <span className="font-bold text-navy-900">Total</span>
                  <span className="font-bold text-navy-900 text-base">
                    {fmt(booking.pricing?.totalAmount || 0)}
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                  booking.payment?.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : booking.payment?.status === 'refunded'
                    ? 'bg-blue-100 text-blue-700'
                    : booking.payment?.status === 'failed'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {booking.payment?.status || 'pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation info */}
          {booking.status === 'cancelled' && booking.cancellation?.cancelledAt && (
            <div className="card p-5 border-red-200">
              <h2 className="text-base font-semibold text-red-700 mb-3">Cancellation Details</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Cancelled on</p>
                  <p className="text-gray-700">{fmtDateTime(booking.cancellation.cancelledAt)}</p>
                </div>
                {booking.cancellation.reason && (
                  <div>
                    <p className="text-xs text-gray-400">Reason</p>
                    <p className="text-gray-700">{booking.cancellation.reason}</p>
                  </div>
                )}
                {(booking.cancellation.refundAmount || 0) > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Refund Amount</p>
                    <p className="font-semibold text-green-600">{fmt(booking.cancellation.refundAmount)}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      Status: {booking.cancellation.refundStatus || 'processing'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card p-5 space-y-3">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Itinerary
            </button>

            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Booking
            </button>

            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <h2 className="text-lg font-bold text-navy-900">Cancel Booking?</h2>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Booking:{' '}
              <span className="font-mono font-semibold text-navy-900">{booking.bookingReference}</span>
            </p>

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
                onClick={() => setShowCancelModal(false)}
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
