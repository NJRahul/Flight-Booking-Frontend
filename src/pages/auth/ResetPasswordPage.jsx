import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/axios';

const schema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const getPasswordStrength = (password) => {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { level: 0, label: 'Weak', textColor: 'text-red-500' };
  if (score <= 2) return { level: 1, label: 'Fair', textColor: 'text-orange-500' };
  if (score <= 3) return { level: 2, label: 'Good', textColor: 'text-blue-500' };
  return { level: 3, label: 'Strong', textColor: 'text-green-500' };
};

const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-green-500'];

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenStatus, setTokenStatus] = useState('idle'); // idle | valid | invalid
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const password = watch('password');
  const strength = getPasswordStrength(password);

  // We validate the token exists by attempting a lightweight check
  // (the actual validation happens server-side on submit)
  useEffect(() => {
    if (!token || token.length < 20) {
      setTokenStatus('invalid');
    } else {
      setTokenStatus('valid');
    }
  }, [token]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authApi.put(`/resetpassword/${token}`, { password: data.password });
      setSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Reset failed. The link may have expired.';
      if (msg.includes('expired') || msg.includes('Invalid')) {
        setTokenStatus('invalid');
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md card text-center">
          <div className="w-14 h-14 bg-danger-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-7 h-7 text-danger-500" />
          </div>
          <h1 className="text-xl font-bold font-display text-navy-900 mb-2">Invalid or expired link</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            This password reset link has expired or is invalid. Reset links are only valid for 10 minutes.
          </p>
          <Link to="/forgot-password" className="btn-primary w-full justify-center">
            Request a new link
          </Link>
          <Link to="/login" className="btn-ghost w-full justify-center mt-2 text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md card text-center">
          <div className="w-14 h-14 bg-success-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-7 h-7 text-success-700" />
          </div>
          <h1 className="text-xl font-bold font-display text-navy-900 mb-2">Password reset!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your password has been updated. Redirecting you to sign in…
          </p>
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to sign in
        </Link>

        <div className="card">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="w-7 h-7 text-primary-600" />
          </div>

          <h1 className="text-2xl font-bold font-display text-navy-900 mb-2">Create new password</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-7">
            Your new password must be at least 8 characters and include an uppercase letter and a number.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* New password */}
            <div>
              <label className="label-text">New password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength && i <= strength.level ? strengthColors[strength.level] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs mt-1 text-gray-400">
                    Strength: <span className={strength?.textColor}>{strength?.label}</span>
                  </p>
                </div>
              )}
              {errors.password && <p className="mt-1 text-xs text-danger-500">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="label-text">Confirm new password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-10 ${errors.confirmPassword ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-danger-500">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-11 mt-2">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Resetting password…</>
              ) : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
