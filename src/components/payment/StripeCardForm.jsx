import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1e293b',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444' },
  },
};

const StripeCardForm = ({ bookingId, clientSecret, totalAmount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [cardholderName, setCardholderName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    if (!cardholderName.trim()) {
      setCardError('Please enter cardholder name');
      return;
    }

    setIsProcessing(true);
    setCardError('');

    try {
      const cardElement = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: { name: cardholderName },
        },
      });

      if (error) {
        setCardError(error.message);
        setIsProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm with backend
        await api.post('/payments/confirm', {
          bookingId,
          paymentIntentId: paymentIntent.id,
          paymentMethod: 'card',
        });
        toast.success('Payment successful!');
        navigate(`/booking/confirmation/${bookingId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Test card hint */}
      {import.meta.env.DEV && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          <p className="font-semibold mb-1">Test Card Details</p>
          <p>Card: <span className="font-mono">4242 4242 4242 4242</span></p>
          <p>Expiry: Any future date &nbsp;·&nbsp; CVC: Any 3 digits</p>
        </div>
      )}

      {/* Cardholder name */}
      <div>
        <label className="label-text">Cardholder Name</label>
        <input
          type="text"
          className="input-field"
          placeholder="Name as on card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      {/* Stripe CardElement */}
      <div>
        <label className="label-text">Card Details</label>
        <div className="border border-gray-200 rounded-xl p-4 bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {cardError && (
          <p className="text-xs text-danger-500 mt-1">{cardError}</p>
        )}
      </div>

      {/* Pay button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className="w-full h-12 btn-primary text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing payment...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            Pay ₹{(totalAmount || 0).toLocaleString('en-IN')}
          </span>
        )}
      </button>
    </form>
  );
};

export default StripeCardForm;
