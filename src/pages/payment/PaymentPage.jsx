import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingApi } from '../../api/axios';
import api from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import PaymentSummary from '../../components/payment/PaymentSummary';

const HAS_RAZORPAY = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  // Demo fallback state
  const [activeTab, setActiveTab] = useState('Card');
  const [upiId, setUpiId] = useState('');
  const [upiProcessing, setUpiProcessing] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [nbProcessing, setNbProcessing] = useState(false);
  const [demoCard, setDemoCard] = useState({ number: '4111 1111 1111 1111', expiry: '12/28', cvv: '123', name: 'Test User' });
  const [demoProcessing, setDemoProcessing] = useState(false);

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

  const handleRazorpayPayment = async () => {
    setPaying(true);
    try {
      // 1. Load Razorpay checkout.js
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load Razorpay SDK');

      // 2. Create order on backend
      const res = await api.post('/payments/create-razorpay-order', { bookingId });
      const { orderId, amount, currency, keyId, bookingReference } = res.data.data;

      // 3. Open Razorpay payment modal
      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'FlightBook',
        description: `Booking ${bookingReference}`,
        image: '/logo.svg',
        order_id: orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        notes: { bookingId },
        theme: { color: '#2563eb' },
        handler: async (response) => {
          // 4. Verify signature on backend and confirm booking
          try {
            await api.post('/payments/verify-razorpay', {
              bookingId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! Booking confirmed.');
            navigate(`/booking/confirmation/${bookingId}`);
          } catch (verifyErr) {
            toast.error(verifyErr.response?.data?.error || 'Payment verification failed. Contact support.');
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.');
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp.error?.description || 'Unknown error'}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to start payment. Please try again.');
      setPaying(false);
    }
  };

  const runDemoPayment = async (paymentMethod, setProcessing) => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
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
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-gray-900">Failed to load booking</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-secondary mx-auto flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const total = booking?.pricing?.totalAmount || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900">Secure Payment</h1>
          </div>
        </div>

        <div className="lg:flex lg:gap-8">
          {/* Left: booking summary */}
          <div className="flex-1 mb-6 lg:mb-0">
            <PaymentSummary booking={booking} />
          </div>

          {/* Right: payment panel */}
          <div className="w-full lg:w-96 shrink-0 space-y-4">

            {/* ── Razorpay payment card ── */}
            {HAS_RAZORPAY ? (
              <div className="card space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <img
                    src="https://razorpay.com/favicon.png"
                    alt="Razorpay"
                    className="w-8 h-8 rounded-lg"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div>
                    <h2 className="font-bold text-gray-900">Pay with Razorpay</h2>
                    <p className="text-xs text-gray-400">Cards · UPI · Net Banking · Wallets</p>
                  </div>
                </div>

                {/* Booking reference */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
                  <p className="text-xs text-gray-400 mb-0.5">Booking Reference</p>
                  <p className="font-mono font-bold text-xl text-primary-700 tracking-widest">
                    {booking?.bookingReference}
                  </p>
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-500">Total Amount</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{total.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Pay button */}
                <button
                  onClick={handleRazorpayPayment}
                  disabled={paying}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {paying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Opening payment...
                    </>
                  ) : (
                    <>Pay ₹{total.toLocaleString('en-IN')} via Razorpay</>
                  )}
                </button>

                {import.meta.env.DEV && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">Razorpay Test Credentials</p>
                    <p>Card: <span className="font-mono">4111 1111 1111 1111</span></p>
                    <p>Expiry: Any future date · CVV: Any 3 digits</p>
                    <p>UPI: <span className="font-mono">success@razorpay</span></p>
                  </div>
                )}

                {/* Supported methods */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {['VISA', 'MC', 'RuPay', 'UPI', 'Paytm', 'GPay'].map(m => (
                    <span key={m} className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded border border-gray-200">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Demo fallback (no Razorpay key configured) ── */
              <div className="card space-y-5">
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-600">
                  Demo mode — Razorpay is not configured. Use pre-filled test values.
                </div>

                {/* Booking reference */}
                <div className="bg-gray-50 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-gray-400">Booking Reference</p>
                  <p className="font-mono font-bold text-lg text-primary-700 tracking-widest">
                    {booking?.bookingReference}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                  {['Card', 'UPI', 'Net Banking'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-primary-600 text-primary-700'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === 'Card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label-text">Name on Card</label>
                      <input type="text" className="input-field" value={demoCard.name}
                        onChange={e => setDemoCard(c => ({ ...c, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label-text">Card Number</label>
                      <input type="text" className="input-field font-mono tracking-widest" maxLength={19}
                        value={demoCard.number} onChange={e => setDemoCard(c => ({ ...c, number: e.target.value }))} />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="label-text">Expiry</label>
                        <input type="text" className="input-field font-mono" maxLength={5}
                          value={demoCard.expiry} onChange={e => setDemoCard(c => ({ ...c, expiry: e.target.value }))} />
                      </div>
                      <div className="flex-1">
                        <label className="label-text">CVV</label>
                        <input type="password" className="input-field font-mono" maxLength={4}
                          value={demoCard.cvv} onChange={e => setDemoCard(c => ({ ...c, cvv: e.target.value }))} />
                      </div>
                    </div>
                    <button
                      onClick={() => runDemoPayment('card', setDemoProcessing)}
                      disabled={demoProcessing}
                      className="w-full h-12 btn-primary text-sm font-semibold disabled:opacity-50"
                    >
                      {demoProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                        </span>
                      ) : `Pay ₹${total.toLocaleString('en-IN')}`}
                    </button>
                  </div>
                )}

                {activeTab === 'UPI' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label-text">UPI ID</label>
                      <input type="text" className="input-field" placeholder="yourname@upi"
                        value={upiId} onChange={e => setUpiId(e.target.value)} />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[{ name: 'GPay', id: 'ok' }, { name: 'PhonePe', id: 'ybl' }, { name: 'Paytm', id: 'paytm' }].map(app => (
                        <button key={app.name} onClick={() => setUpiId(`test@${app.id}`)}
                          className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-200">
                          {app.name}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => runDemoPayment('upi', setUpiProcessing)} disabled={!upiId || upiProcessing}
                      className="w-full h-12 btn-primary text-sm font-semibold disabled:opacity-50">
                      {upiProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Awaiting approval...
                        </span>
                      ) : `Pay ₹${total.toLocaleString('en-IN')} via UPI`}
                    </button>
                  </div>
                )}

                {activeTab === 'Net Banking' && (
                  <div className="space-y-4">
                    <div>
                      <label className="label-text">Select Bank</label>
                      <select className="input-field" value={selectedBank} onChange={e => setSelectedBank(e.target.value)}>
                        <option value="">Choose your bank</option>
                        {['State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank'].map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => runDemoPayment('net_banking', setNbProcessing)}
                      disabled={!selectedBank || nbProcessing}
                      className="w-full h-12 btn-primary text-sm font-semibold disabled:opacity-50">
                      {nbProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                        </span>
                      ) : 'Redirect to Bank →'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trust line */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock className="w-3 h-3" />
              <span>256-bit SSL · Secured by Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
