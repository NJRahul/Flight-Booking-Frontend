import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Send, Loader2, InboxIcon } from 'lucide-react';
import { authApi } from '../../api/axios';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authApi.post('/forgotpassword', { email: data.email });
      setSubmittedEmail(data.email);
      setSubmitted(true);
      setCountdown(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsSubmitting(true);
    try {
      await authApi.post('/forgotpassword', { email: submittedEmail });
      setCountdown(60);
      toast.success('Reset link resent!');
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to sign in
        </Link>

        <div className="card">
          {!submitted ? (
            <>
              {/* Icon */}
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="w-7 h-7 text-primary-600" />
              </div>

              <h1 className="text-2xl font-bold font-display text-navy-900 mb-2">Forgot your password?</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-7">
                Enter your email address and we'll send you a link to reset your password. The link expires in 10 minutes.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-5">
                  <label className="label-text">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      autoFocus
                      className={`input-field pl-10 ${errors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-danger-500">{errors.email.message}</p>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-11">
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending reset link…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reset Link</>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="w-14 h-14 bg-success-50 rounded-2xl flex items-center justify-center mb-6">
                <InboxIcon className="w-7 h-7 text-success-700" />
              </div>

              <h1 className="text-2xl font-bold font-display text-navy-900 mb-2">Check your inbox</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-2">
                We've sent a password reset link to
              </p>
              <p className="font-semibold text-navy-900 text-sm mb-6 break-all">{submittedEmail}</p>

              <div className="bg-primary-50 rounded-xl p-4 mb-6">
                <p className="text-primary-700 text-xs leading-relaxed">
                  Didn't receive the email? Check your spam folder, or wait a moment and try resending.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isSubmitting}
                className={`w-full h-11 rounded-xl text-sm font-medium transition-all duration-200 ${
                  countdown > 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Resending…
                  </span>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend email'
                )}
              </button>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
