import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { User, Lock, Settings, FileText, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { authApi } from '../../api/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { NATIONALITIES, MEAL_PREFERENCES, SEAT_CLASSES } from '../../utils/constants';
import toast from 'react-hot-toast';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const SEAT_POSITIONS = ['window', 'middle', 'aisle'];

const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

export default function ProfilePage() {
  const { user, updateUser, login } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal form (react-hook-form for tab 1 only)
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  // Documents tab state
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [docsDirty, setDocsDirty] = useState(false);

  // Preferences tab state
  const [prefs, setPrefs] = useState({
    seatClass: 'economy',
    seatPosition: 'window',
    mealPreference: 'standard',
    notificationEmail: true,
    notificationSMS: false,
    newsletter: false,
  });
  const [prefsDirty, setPrefsDirty] = useState(false);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    authApi.get('/me').then(r => {
      const u = r.data.data?.user || r.data.user;
      setProfileData(u);
    }).catch(() => toast.error('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profileData) return;
    reset({
      name: profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      dateOfBirth: profileData.dateOfBirth
        ? format(new Date(profileData.dateOfBirth), 'yyyy-MM-dd')
        : '',
      gender: profileData.gender || '',
      nationality: profileData.nationality || '',
    });
    setPassportNumber(profileData.passportNumber || '');
    setPassportExpiry(
      profileData.passportExpiry
        ? format(new Date(profileData.passportExpiry), 'yyyy-MM-dd')
        : ''
    );
    setEmergencyName(profileData.emergencyContact?.name || '');
    setEmergencyPhone(profileData.emergencyContact?.phone || '');
    if (profileData.preferences) {
      setPrefs(p => ({ ...p, ...profileData.preferences }));
    }
  }, [profileData, reset]);

  const initials = (user?.name || '')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'documents', label: 'Travel Documents', icon: FileText },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  const onSavePersonal = async (data) => {
    setSaving(true);
    try {
      const r = await authApi.put('/updateprofile', {
        name: data.name,
        phone: data.phone || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender || undefined,
        nationality: data.nationality || undefined,
      });
      updateUser(r.data.data?.user);
      toast.success('Profile updated successfully');
      reset(data);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const onSaveDocuments = async () => {
    setSaving(true);
    try {
      await authApi.put('/updateprofile', {
        passportNumber: passportNumber ? passportNumber.toUpperCase() : undefined,
        passportExpiry: passportExpiry || undefined,
        emergencyContact: { name: emergencyName, phone: emergencyPhone },
      });
      toast.success('Documents saved successfully');
      setDocsDirty(false);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onSavePrefs = async () => {
    setSaving(true);
    try {
      await authApi.put('/updateprofile', { preferences: prefs });
      updateUser({ preferences: prefs });
      toast.success('Preferences saved');
      setPrefsDirty(false);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      const r = await authApi.put('/updatepassword', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (r.data.token && r.data.user) login(r.data.user, r.data.token);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Password change failed');
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
    setPrefsDirty(true);
  };

  const pwStrength = getPasswordStrength(newPassword);

  if (loading) {
    return (
      <div className="w-full">
        <div className="lg:grid lg:grid-cols-4 gap-6">
          <div className="card p-6 h-64 animate-pulse bg-gray-100 lg:col-span-1" />
          <div className="card p-6 h-96 animate-pulse bg-gray-100 lg:col-span-3 mt-5 lg:mt-0" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="lg:grid lg:grid-cols-4 gap-6 space-y-5 lg:space-y-0">
        {/* Sidebar */}
        <div className="lg:col-span-1 card p-6 text-center space-y-3 h-fit">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-navy-900">{user?.name || 'User'}</p>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-0.5">
              <span className="truncate max-w-[140px]">{user?.email}</span>
              {profileData?.isEmailVerified ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <span className="text-xs text-yellow-600 font-medium ml-1">Unverified</span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Member since {format(new Date(profileData?.createdAt || user?.createdAt || Date.now()), 'MMMM yyyy')}
            </p>
            <p className="text-sm font-semibold text-primary-600 mt-1">0 Frequent Flyer Points</p>
          </div>

          <div className="border-t border-gray-100 pt-3 space-y-1 text-left">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          {/* TAB 1: Personal Info */}
          {activeTab === 'personal' && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy-900 mb-5">Personal Information</h2>
              <form onSubmit={handleSubmit(onSavePersonal)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label-text">Full Name</label>
                    <input
                      {...register('name', { required: true })}
                      className="input-field mt-1"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="label-text">Email</label>
                    <input
                      {...register('email')}
                      className="input-field mt-1 bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-gray-400 mt-1">Contact support to change email</p>
                  </div>

                  <div>
                    <label className="label-text">Phone</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="input-field mt-1"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div>
                    <label className="label-text">Date of Birth</label>
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      className="input-field mt-1"
                    />
                  </div>

                  <div>
                    <label className="label-text">Nationality</label>
                    <select {...register('nationality')} className="input-field mt-1">
                      <option value="">Select nationality...</option>
                      {NATIONALITIES.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-text">Gender</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {GENDER_OPTIONS.map(({ value, label }) => (
                      <label key={value} className="cursor-pointer">
                        <input
                          type="radio"
                          value={value}
                          {...register('gender')}
                          className="sr-only peer"
                        />
                        <span className="px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-600 peer-checked:border-primary-500 peer-checked:bg-primary-50 peer-checked:text-primary-700 transition-colors cursor-pointer block">
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving || !isDirty}
                    className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Travel Documents */}
          {activeTab === 'documents' && (
            <div className="card p-6">
              <h2 className="text-lg font-bold text-navy-900 mb-5">Travel Documents</h2>
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Passport Number</label>
                    <input
                      type="text"
                      className="input-field mt-1 uppercase"
                      placeholder="e.g. P1234567"
                      value={passportNumber}
                      onChange={e => { setPassportNumber(e.target.value); setDocsDirty(true); }}
                    />
                    <p className="text-xs text-gray-400 mt-1">Stored securely and encrypted</p>
                  </div>

                  <div>
                    <label className="label-text">Passport Expiry Date</label>
                    <input
                      type="date"
                      className="input-field mt-1"
                      value={passportExpiry}
                      onChange={e => { setPassportExpiry(e.target.value); setDocsDirty(true); }}
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-navy-900 mb-4">Emergency Contact</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label-text">Name</label>
                      <input
                        type="text"
                        className="input-field mt-1"
                        placeholder="Emergency contact name"
                        value={emergencyName}
                        onChange={e => { setEmergencyName(e.target.value); setDocsDirty(true); }}
                      />
                    </div>
                    <div>
                      <label className="label-text">Phone</label>
                      <input
                        type="tel"
                        className="input-field mt-1"
                        placeholder="+91 98765 43210"
                        value={emergencyPhone}
                        onChange={e => { setEmergencyPhone(e.target.value); setDocsDirty(true); }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onSaveDocuments}
                    disabled={saving || !docsDirty}
                    className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Preferences */}
          {activeTab === 'preferences' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-bold text-navy-900">Preferences</h2>

              <div>
                <label className="label-text mb-3 block">Default Seat Class</label>
                <div className="grid grid-cols-3 gap-3">
                  {SEAT_CLASSES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setPrefs(p => ({ ...p, seatClass: value })); setPrefsDirty(true); }}
                      className={`border-2 rounded-xl p-3 cursor-pointer text-center transition-colors ${
                        prefs.seatClass === value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <p className="text-sm font-semibold">{label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text mb-3 block">Seat Position</label>
                <div className="flex flex-wrap gap-2">
                  {SEAT_POSITIONS.map(pos => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => { setPrefs(p => ({ ...p, seatPosition: pos })); setPrefsDirty(true); }}
                      className={`px-4 py-2 rounded-full border text-sm font-medium capitalize transition-colors ${
                        prefs.seatPosition === pos
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text">Meal Preference</label>
                <select
                  className="input-field mt-1"
                  value={prefs.mealPreference}
                  onChange={e => { setPrefs(p => ({ ...p, mealPreference: e.target.value })); setPrefsDirty(true); }}
                >
                  {MEAL_PREFERENCES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text mb-3 block">Notifications</label>
                <div className="space-y-3">
                  {[
                    { key: 'notificationEmail', label: 'Email notifications', desc: 'Booking confirmations, updates' },
                    { key: 'notificationSMS', label: 'SMS notifications', desc: 'Flight alerts and reminders' },
                    { key: 'newsletter', label: 'Promotions and deals', desc: 'Exclusive offers and discounts' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <p className="text-xs text-gray-400">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePref(key)}
                        className={`relative inline-flex h-6 w-11 rounded-full transition-colors flex-shrink-0 ${
                          prefs[key] ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            prefs[key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 py-2 opacity-60">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Flight status updates</p>
                      <p className="text-xs text-gray-400">Always enabled for safety</p>
                    </div>
                    <div className="relative inline-flex h-6 w-11 rounded-full bg-primary-600 flex-shrink-0">
                      <span className="absolute top-1 translate-x-6 h-4 w-4 rounded-full bg-white shadow" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onSavePrefs}
                  disabled={saving || !prefsDirty}
                  className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Security */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="card p-6 space-y-5">
                <h2 className="text-lg font-bold text-navy-900">Change Password</h2>

                <div>
                  <label className="label-text">Current Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      className="input-field pr-10"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label-text">New Password</label>
                  <div className="relative mt-1">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      className="input-field pr-10"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {newPassword.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i < pwStrength ? strengthColors[pwStrength - 1] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        {pwStrength > 0 ? strengthLabels[pwStrength - 1] : 'Too weak'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label-text">Confirm New Password</label>
                  <input
                    type="password"
                    className={`input-field mt-1 ${
                      confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : ''
                    }`}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>

              <div className="card p-6">
                <h2 className="text-base font-semibold text-navy-900 mb-3">Active Sessions</h2>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Current device</p>
                    <p className="text-xs text-gray-400">You are currently signed in on 1 device</p>
                  </div>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Active
                  </span>
                </div>
              </div>

              <div className="card p-6 border-red-200">
                <h2 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure? This cannot be undone.')) {
                      toast.error('Please contact support to delete your account.');
                    }
                  }}
                  className="px-4 py-2 border border-red-400 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
