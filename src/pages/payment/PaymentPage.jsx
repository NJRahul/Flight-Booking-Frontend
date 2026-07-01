import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Shield, Lock, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingApi } from '../../api/axios';
import api from '../../api/axios';
import PaymentSummary from '../../components/payment/PaymentSummary';
import StripeCardForm from '../../components/payment/StripeCardForm';

// Initialize Stripe outside component to avoid re-creation on re-renders
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [booking, setBooking] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('Card');
  const [upiId, setUpiId] = useState('');
  const [upiProcessing, setUpiProcessing] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [nbProcessing, setNbProcessing] = useState(false);

  // Demo card form state (used when Stripe is not configured)
  const [demoCard, setDemoCard] = useState({ number: '4242 4242 4242 4242', expiry: '12/28', cvv: '123', name: 'Test User' });
  const [demoProcessing, setDemoProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch booking details
        const bookingRes = await bookingApi.get(`/${bookingId}`);
        const bookingData = bookingRes.data?.data?.booking || bookingRes.data?.data;
        setBooking(bookingData);

        // Prefer clientSecret passed via navigation state (already created during booking)
        // so we avoid a redundant /create-intent call.
        const stateSecret = location.state?.clientSecret;
        if (stateSecret) {
          setClientSecret(stateSecret);
        } else if (stripePromise) {
          try {
            const intentRes = await api.post('/payments/create-intent', { bookingId });
            setClientSecret(intentRes.data?.data?.clientSecret || '');
          } catch {
            // Stripe not configured on backend — demo mode will handle card tab
          }
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchData();
  }, [bookingId]);

  const runDemoPayment = async (paymentMethod, setProcessing) => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2500));
    try {
      await api.post('/payments/confirm-demo', { bookingId, paymentMethod });
      toast.success('Payment successful! Booking confirmed.');
      navigate(`/booking/confirmation/${bookingId}`);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpiPay = () => {
    if (!upiId) return;
    runDemoPayment('upi', setUpiProcessing);
  };

  const handleNetBankingPay = () => {
    if (!selectedBank) return;
    runDemoPayment('net_banking', setNbProcessing);
  };

  const handleDemoCardPay = () => {
    runDemoPayment('card', setDemoProcessing);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading payment details...</p>
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
            className="btn-secondary flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost p-2 rounded-xl text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Secure Payment</h1>
          </div>
        </div>

        {/* Main layout */}
        <div className="lg:flex lg:gap-8">
          {/* LEFT column */}
          <div className="flex-1 mb-6 lg:mb-0 space-y-6">
            <PaymentSummary booking={booking} />

            {/* Collapsible extras info */}
            {booking?.extras && booking.extras.length > 0 && (
              <ExtrasBreakdown extras={booking.extras} />
            )}
          </div>

          {/* RIGHT column */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="card space-y-6">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-success-700" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Secure Payment</h2>
                  <p className="text-xs text-gray-400">256-bit SSL encrypted</p>
                </div>
              </div>

              {/* Booking reference badge */}
              <div className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-gray-400">Booking Reference</p>
                <p className="font-mono font-bold text-lg text-primary-700 tracking-widest">
                  {booking?.bookingReference}
                </p>
              </div>

              {/* Payment method tabs */}
              <div className="flex border-b border-gray-200 -mx-1">
                {['Card', 'UPI', 'Net Banking'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Card tab */}
              {activeTab === 'Card' && (
                stripePromise && clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: { colorPrimary: '#2563eb', borderRadius: '12px' },
                      },
                    }}
                  >
                    <StripeCardForm
                      bookingId={bookingId}
                      totalAmount={booking?.pricing?.totalAmount}
                    />
                  </Elements>
                ) : (
                  /* Demo card form — used when Stripe is not configured */
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-600">
                      Demo mode — pre-filled with test card details
                    </div>
                    <div>
                      <label className="label-text">Name on Card</label>
                      <input
                        type="text"
                        className="input-field"
                        value={demoCard.name}
                        onChange={e => setDemoCard(c => ({ ...c, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="label-text">Card Number</label>
                      <input
                        type="text"
                        className="input-field font-mono tracking-widest"
                        maxLength={19}
                        value={demoCard.number}
                        onChange={e => setDemoCard(c => ({ ...c, number: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="label-text">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          className="input-field font-mono"
                          maxLength={5}
                          value={demoCard.expiry}
                          onChange={e => setDemoCard(c => ({ ...c, expiry: e.target.value }))}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="label-text">CVV</label>
                        <input
                          type="password"
                          className="input-field font-mono"
                          maxLength={4}
                          value={demoCard.cvv}
                          onChange={e => setDemoCard(c => ({ ...c, cvv: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleDemoCardPay}
                      disabled={demoProcessing}
                      className="w-full h-12 btn-primary text-sm font-semibold disabled:opacity-50"
                    >
                      {demoProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing payment...
                        </span>
                      ) : (
                        `Pay ₹${(booking?.pricing?.totalAmount || 0).toLocaleString('en-IN')}`
                      )}
                    </button>
                  </div>
                )
              )}

              {/* UPI tab */}
              {activeTab === 'UPI' && (
                <div className="space-y-4">
                  <div>
                    <label className="label-text">UPI ID</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="yourname@paytm"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Popular UPI Apps:</p>
                  <div className="flex gap-2">
                    {[
                      { name: 'GPay', color: 'bg-blue-600' },
                      { name: 'PhonePe', color: 'bg-purple-600' },
                      { name: 'Paytm', color: 'bg-blue-500' },
                    ].map(app => (
                      <button
                        key={app.name}
                        onClick={() => setUpiId(`yourname@${app.name.toLowerCase()}`)}
                        className={`${app.color} text-white text-xs font-semibold px-3 py-1.5 rounded-lg`}
                      >
                        {app.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleUpiPay}
                    disabled={!upiId || upiProcessing}
                    className="w-full h-12 btn-primary text-sm font-semibold disabled:opacity-50"
                  >
                    {upiProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Awaiting approval...
                      </span>
                    ) : (
                      `Pay ₹${(booking?.pricing?.totalAmount || 0).toLocaleString('en-IN')} via UPI`
                    )}
                  </button>
                  {upiProcessing && (
                    <p className="text-xs text-gray-500 text-center animate-pulse">
                      Open your UPI app and approve the payment
                    </p>
                  )}
                </div>
              )}

              {/* Net Banking tab */}
              {activeTab === 'Net Banking' && (
                <div className="space-y-4">
                  <div>
                    <label className="label-text">Select Bank</label>
                    <select
                      className="input-field"
                      value={selectedBank}
                      onChange={e => setSelectedBank(e.target.value)}
                    >
                      <option value="">Choose your bank</option>
                      {[
                        'State Bank of India (SBI)',
                        'HDFC Bank',
                        'ICICI Bank',
                        'Axis Bank',
                        'Kotak Mahindra Bank',
                        'Punjab National Bank (PNB)',
                        'Bank of Baroda',
                        'Yes Bank',
                        'IndusInd Bank',
                      ].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    You'll be redirected to your bank's secure portal to complete the payment.
                  </p>
                  <button
                    onClick={handleNetBankingPay}
                    disabled={!selectedBank || nbProcessing}
                    className="w-full h-12 btn-primary text-sm font-semibold disabled:opacity-50"
                  >
                    {nbProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting...
                      </span>
                    ) : (
                      'Redirect to Bank →'
                    )}
                  </button>
                </div>
              )}

              {/* Trust badges */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-3">
                  <Lock className="w-3 h-3" />
                  <span>256-bit SSL encrypted · Powered by Stripe</span>
                </div>
                <div className="flex justify-center gap-2">
                  {['VISA', 'MC', 'RuPay', 'AMEX'].map(card => (
                    <span
                      key={card}
                      className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded border border-gray-200"
                    >
                      {card}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Small helper component for extras breakdown (shown in left column)
const ExtrasBreakdown = ({ extras }) => {
  const [open, setOpen] = useState(false);
  if (!extras || extras.length === 0) return null;

  return (
    <div className="card">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
      >
        <span>Add-on Extras ({extras.length})</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul className="mt-3 space-y-2">
          {extras.map((extra, i) => (
            <li key={i} className="flex justify-between text-sm text-gray-600">
              <span className="capitalize">{extra.name || extra.type}</span>
              <span>₹{(extra.price || 0).toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PaymentPage;
