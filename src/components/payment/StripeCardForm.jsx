import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StripeCardForm = ({ bookingId, totalAmount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation/${bookingId}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMsg(error.message || 'Payment failed.');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await api.post('/payments/confirm', {
          bookingId,
          paymentIntentId: paymentIntent.id,
          paymentMethod: 'card',
        });
        toast.success('Payment successful!');
        navigate(`/booking/confirmation/${bookingId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment confirmation failed.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Test card hint */}
      {import.meta.env.DEV && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
          <p className="font-semibold mb-1">Stripe Test Card</p>
          <p>Card: <span className="font-mono">4242 4242 4242 4242</span></p>
          <p>Expiry: Any future date &nbsp;·&nbsp; CVC: Any 3 digits</p>
        </div>
      )}

      {/* Stripe PaymentElement — handles cards, wallets, and more */}
      <PaymentElement
        options={{
          layout: 'tabs',
          fields: { billingDetails: { name: 'auto' } },
        }}
      />

      {errorMsg && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
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
