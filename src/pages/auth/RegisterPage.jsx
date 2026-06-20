import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Plane, User, Phone, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { authApi } from '../../api/axios';
import { NATIONALITIES } from '../../utils/constants';

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
  { code: '+81', label: '🇯🇵 +81' },
  { code: '+86', label: '🇨🇳 +86' },
  { code: '+55', label: '🇧🇷 +55' },
  { code: '+27', label: '🇿🇦 +27' },
];

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address'),
  countryCode: z.string().default('+91'),
  phone: z.string().regex(/^\d{7,15}$/, 'Enter a valid phone number (digits only)').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  agreeTerms: z.boolean().refine((v) => v === true, 'You must agree to the Terms of Service'),
  newsletter: z.boolean().optional(),
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

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { countryCode: '+91', newsletter: true, agreeTerms: false },
  });

  const password = watch('password');
  const strength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const phone = data.phone ? `${data.countryCode}${data.phone}` : undefined;
      const payload = {
        name: `${data.firstName.trim()} ${data.lastName.trim()}`,
        email: data.email,
        password: data.password,
        ...(phone && { phone }),
      };
      const res = await authApi.post('/register', payload);
      const { token, user } = res.data;
      login(user, token);
      toast.success('Account created! Welcome to FlightBook ✈️');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `input-field ${errors[field] ? 'border-danger-500 focus:ring-danger-500' : ''}`;

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-navy-900 flex-col justify-center p-14 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Plane className="w-5 h-5 text-white -rotate-45" />
            </div>
            <span className="text-white text-xl font-bold font-display">FlightBook</span>
          </div>
          <h1 className="text-white font-display font-bold text-4xl leading-tight mb-4">
            Join 1M+<br />Travellers
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed mb-10 max-w-sm">
            Create your free account and start booking flights at the best prices in seconds.
          </p>
          <div className="space-y-3">
            {['Free to join, no hidden fees', 'Earn rewards on every booking', 'Cancel or change anytime'].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-primary-200 text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center py-10 px-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Plane className="w-4 h-4 text-white -rotate-45" />
            </div>
            <span className="font-bold text-navy-900 font-display">FlightBook</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold font-display text-navy-900 mb-1">Create your account</h2>
            <p className="text-gray-500 text-sm">Start booking flights in minutes — it's free</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">First name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register('firstName')} placeholder="John" className={`${inputClass('firstName')} pl-9`} />
                </div>
                {errors.firstName && <p className="mt-1 text-xs text-danger-500">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label-text">Last name</label>
                <input {...register('lastName')} placeholder="Doe" className={inputClass('lastName')} />
                {errors.lastName && <p className="mt-1 text-xs text-danger-500">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label-text">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" className={`${inputClass('email')} pl-10`} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-danger-500">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="label-text">Phone number <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="flex gap-2">
                <select {...register('countryCode')} className="select-field w-32 flex-shrink-0 text-sm">
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input {...register('phone')} type="tel" placeholder="9876543210" className={`${inputClass('phone')} pl-10`} />
                </div>
              </div>
              {errors.phone && <p className="mt-1 text-xs text-danger-500">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 chars with uppercase & number"
                  className={`${inputClass('password')} pl-10 pr-10`}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength indicator */}
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
              <label className="label-text">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`${inputClass('confirmPassword')} pl-10 pr-10`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-danger-500">{errors.confirmPassword.message}</p>}
            </div>

            {/* Optional fields row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-text">Date of birth <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  {...register('dateOfBirth')}
                  type="date"
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0]}
                  className={inputClass('dateOfBirth')}
                />
              </div>
              <div>
                <label className="label-text">Nationality <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select {...register('nationality')} className={`${inputClass('nationality')} pl-10`}>
                    <option value="">Select…</option>
                    {NATIONALITIES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input {...register('agreeTerms')} type="checkbox" className="mt-0.5 w-4 h-4 rounded accent-primary-600 cursor-pointer flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">Privacy Policy</a>
                </span>
              </label>
              {errors.agreeTerms && <p className="text-xs text-danger-500 -mt-1 ml-7">{errors.agreeTerms.message}</p>}

              <label className="flex items-start gap-3 cursor-pointer">
                <input {...register('newsletter')} type="checkbox" className="mt-0.5 w-4 h-4 rounded accent-primary-600 cursor-pointer flex-shrink-0" />
                <span className="text-sm text-gray-600">Subscribe to exclusive flight deals and promotions</span>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-11 text-base mt-2">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
