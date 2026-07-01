import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plane, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingApi } from '../../api/axios';

const ConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await bookingApi.get(`/${bookingId}`);
        const bookingData = res.data?.data?.booking || res.data?.data;
        setBooking(bookingData);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchBooking();
  }, [bookingId]);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await bookingApi.get(`/${bookingId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `FlightBook-${booking?.bookingReference}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your booking confirmation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Failed to load booking</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary mx-auto"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const depTime = booking?.flight?.departureTime ? new Date(booking.flight.departureTime) : null;
  const arrTime = booking?.flight?.arrivalTime ? new Date(booking.flight.arrivalTime) : null;
  const flightDuration = booking?.flight?.duration || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* 1. Success animation */}
        <div className="text-center py-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success-50 border-4 border-success-500 mb-4"
            style={{ animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <svg
              className="w-12 h-12 text-success-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-success-700 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500">Your booking has been confirmed. Check your email for the e-ticket.</p>
          <style>{`@keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>

        {/* 2. Booking Reference Box */}
        <div className="card border-2 border-success-500 text-center">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Your Booking Reference</p>
          <p className="font-mono text-4xl font-bold text-primary-700 tracking-widest mb-1">
            {booking?.bookingReference}
          </p>
          <p className="text-xs text-gray-400">Save this for check-in and support</p>
        </div>

        {/* 3. Flight Summary Card */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Flight Details</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
              {booking?.flight?.airline?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">{booking?.flight?.airline?.name}</p>
              <p className="text-sm text-gray-400">{booking?.flight?.flightNumber}</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-200">
                Confirmed
              </span>
            </div>
          </div>

          {/* Route visual */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {depTime ? format(depTime, 'HH:mm') : '--'}
              </p>
              <p className="font-semibold text-gray-700">{booking?.flight?.origin?.code}</p>
              <p className="text-xs text-gray-400">{booking?.flight?.origin?.city}</p>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <p className="text-xs text-gray-400 mb-1">
                {Math.floor(flightDuration / 60)}h {flightDuration % 60}m
              </p>
              <div className="flex items-center gap-1 w-full">
                <div className="flex-1 h-px bg-gray-300" />
                <Plane className="w-4 h-4 text-primary-600" />
                <div className="flex-1 h-px bg-gray-300" />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {(booking?.flight?.stops ?? 0) === 0 ? 'Non-stop' : `${booking.flight.stops} stop${booking.flight.stops > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {arrTime ? format(arrTime, 'HH:mm') : '--'}
              </p>
              <p className="font-semibold text-gray-700">{booking?.flight?.destination?.code}</p>
              <p className="text-xs text-gray-400">{booking?.flight?.destination?.city}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span>{depTime ? format(depTime, 'EEE, dd MMM yyyy') : ''}</span>
            <span className="capitalize">{booking?.class} Class</span>
            <span>
              {booking?.passengers?.length} Passenger{booking?.passengers?.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* 4. Passengers & Seats Card */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Passengers</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Seat</th>
                <th className="text-left py-2">Meal</th>
              </tr>
            </thead>
            <tbody>
              {booking?.passengers?.map((p, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-2 font-medium">{p.firstName} {p.lastName}</td>
                  <td className="py-2 capitalize text-gray-500">{p.type}</td>
                  <td className="py-2 text-gray-500">{p.seatNumber || 'TBA'}</td>
                  <td className="py-2 text-gray-500 capitalize">{p.mealPreference || 'standard'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 5. Payment Receipt Card */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Receipt</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono text-xs">{booking?.payment?.transactionId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="font-bold text-success-700">
                ₹{(booking?.pricing?.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span className="capitalize">{booking?.payment?.method || 'Card'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paid At</span>
              <span>
                {booking?.payment?.paidAt
                  ? format(new Date(booking.payment.paidAt), 'dd MMM yyyy, HH:mm')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. What's Next section */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="space-y-3">
            {[
              {
                icon: '📋',
                title: 'Check-in opens 48 hours before departure',
                desc: 'You can check-in online via the airline website',
                color: 'bg-blue-50 border-blue-200',
              },
              {
                icon: '🪪',
                title: 'Carry your government ID',
                desc: 'Passport or Aadhaar card required at the airport',
                color: 'bg-gray-50 border-gray-200',
              },
              {
                icon: '⏰',
                title: 'Arrive early',
                desc: 'Reach 2 hours before for domestic, 3 hours for international',
                color: 'bg-amber-50 border-amber-200',
              },
              {
                icon: '📱',
                title: 'Download boarding pass',
                desc: 'Available after check-in via airline app or website',
                color: 'bg-green-50 border-green-200',
              },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${item.color}`}>
                <span className="text-lg">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? 'Generating...' : 'Download Itinerary PDF'}
          </button>
          <button
            onClick={() => navigate('/dashboard/bookings')}
            className="btn-primary flex-1"
          >
            View My Bookings
          </button>
        </div>

        <div className="text-center space-y-2">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-primary-600 hover:underline"
          >
            Book Another Flight
          </button>

          {/* Share section */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <p className="text-xs text-gray-400">Share your trip:</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied!');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-1"
            >
              Copy Link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                'I just booked a flight with FlightBook! Reference: ' + booking?.bookingReference
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-2 py-1"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
