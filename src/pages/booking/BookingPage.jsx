import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Loader2, Plane, Users, MessageCircle, ChevronLeft, ArrowLeftRight } from 'lucide-react';
import { flightApi, bookingApi, authApi } from '../../api/axios';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuthStore } from '../../store/useAuthStore';
import BookingStepIndicator from '../../components/booking/BookingStepIndicator';
import PriceBreakdown from '../../components/booking/PriceBreakdown';
import PassengerForm from '../../components/booking/PassengerForm';

// ─── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtTime = (iso) => { try { return format(parseISO(iso), 'HH:mm'); } catch { return iso || '--'; } };
const fmtDate = (iso) => { try { return format(parseISO(iso), 'EEE, dd MMM yyyy'); } catch { return iso || '--'; } };

const STEPS = ['Traveller Details', 'Extras & Add-ons', 'Review', 'Payment'];

const EXTRAS_CONFIG = [
  {
    key: 'extraBaggage',
    icon: '🧳',
    title: 'Extra Baggage',
    description: 'Add 15kg checked baggage',
    price: 1299,
    hasCounter: true,
  },
  {
    key: 'travelInsurance',
    icon: '🛡️',
    title: 'Travel Insurance',
    description: 'Comprehensive travel coverage',
    price: 499,
    hasCounter: false,
  },
  {
    key: 'mealUpgrade',
    icon: '🍽️',
    title: 'Meal Upgrade',
    description: 'Premium meal menu',
    price: 299,
    hasCounter: false,
  },
  {
    key: 'priorityBoarding',
    icon: '⚡',
    title: 'Priority Boarding',
    description: 'Be first to board',
    price: 199,
    hasCounter: false,
  },
];

// ─── FlightSummaryBar (sidebar compact card) ───────────────────────────────
const FlightLeg = ({ flight, label, seatClass }) => {
  if (!flight) return null;
  const airline = flight.airline || {};
  const originCode = flight.origin?.code || '---';
  const destCode = flight.destination?.code || '---';
  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-1">
      {label && <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-1">{label}</p>}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {(airline.code || 'AI').slice(0, 2)}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{airline.name || 'Airline'}</p>
          <p className="text-xs text-gray-500">{flight.flightNumber || ''}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-700 font-semibold">
        <span>{originCode}</span>
        <Plane className="w-3 h-3 text-primary-400" />
        <span>{destCode}</span>
      </div>
      <p className="text-xs text-gray-500">{fmtDate(flight.departureTime)}</p>
      <p className="text-xs text-gray-500">{fmtTime(flight.departureTime)} – {fmtTime(flight.arrivalTime)}</p>
      <p className="text-xs text-gray-500 capitalize">{seatClass} Class</p>
    </div>
  );
};

const FlightSummaryBar = ({ flight, returnFlight, seatClass }) => {
  if (!flight) return null;
  const isRoundTrip = !!returnFlight;
  return (
    <div className="space-y-2">
      <FlightLeg flight={flight} seatClass={seatClass} label={isRoundTrip ? 'Outbound' : null} />
      {isRoundTrip && (
        <>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            <ArrowLeftRight className="w-3 h-3 shrink-0" />
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <FlightLeg flight={returnFlight} seatClass={seatClass} label="Return" />
        </>
      )}
    </div>
  );
};

// ─── Step 0: Traveller Details ─────────────────────────────────────────────
const StepTraveller = ({ onNext }) => {
  const {
    passengers, updatePassenger, contactInfo, setContactInfo,
  } = useBookingStore();
  const { user } = useAuthStore();

  const [errors, setErrors] = useState({});
  const [showEmergency, setShowEmergency] = useState(false);

  // Fallback: if profile fetch didn't run yet, at least fill email from auth store
  useEffect(() => {
    if (user?.email && !contactInfo.email) {
      setContactInfo({ ...contactInfo, email: user.email });
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePassengerUpdate = (index, patch) => {
    updatePassenger(index, patch);
  };

  const validate = () => {
    const newErrors = {};
    let valid = true;

    passengers.forEach((p, i) => {
      const pErr = {};
      if (!p.firstName?.trim()) { pErr.firstName = 'First name is required'; valid = false; }
      if (!p.lastName?.trim()) { pErr.lastName = 'Last name is required'; valid = false; }
      if (!p.dateOfBirth) { pErr.dateOfBirth = 'Date of birth is required'; valid = false; }
      if (p.type !== 'infant' && !p.passportNumber?.trim()) {
        pErr.passportNumber = 'Passport number is required'; valid = false;
      }
      newErrors[`pax_${i}`] = pErr;
    });

    if (!contactInfo.email?.trim()) { newErrors.email = 'Email is required'; valid = false; }
    if (!contactInfo.phone?.trim()) { newErrors.phone = 'Phone is required'; valid = false; }

    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (validate()) onNext();
    else toast.error('Please fill in all required fields');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Traveller Details</h2>

      {/* Passenger forms */}
      {passengers.map((pax, i) => (
        <PassengerForm
          key={i}
          passenger={pax}
          passengerIndex={i}
          passengerType={pax.type}
          onUpdate={handlePassengerUpdate}
          errors={errors[`pax_${i}`] || {}}
        />
      ))}

      {/* Contact Details */}
      <div className="card space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Contact Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Email Address *</label>
            <input
              type="email"
              className={`input-field ${errors.email ? 'border-danger-500' : ''}`}
              value={contactInfo.email || ''}
              onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-danger-500 mt-0.5">{errors.email}</p>}
          </div>
          <div>
            <label className="label-text">Phone Number *</label>
            <div className="flex gap-2">
              <span className="input-field w-16 text-center text-gray-500 shrink-0 flex items-center justify-center text-sm">
                +91
              </span>
              <input
                type="tel"
                className={`input-field flex-1 ${errors.phone ? 'border-danger-500' : ''}`}
                value={contactInfo.phone || ''}
                onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                placeholder="9XXXXXXXXX"
                maxLength={10}
              />
            </div>
            {errors.phone && <p className="text-xs text-danger-500 mt-0.5">{errors.phone}</p>}
          </div>
        </div>

        {/* Emergency contact toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowEmergency((v) => !v)}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {showEmergency ? '− Hide' : '+ Add'} Emergency Contact
          </button>

          {showEmergency && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="label-text">Emergency Contact Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={contactInfo.emergencyContact?.name || ''}
                  onChange={(e) =>
                    setContactInfo({
                      ...contactInfo,
                      emergencyContact: { ...contactInfo.emergencyContact, name: e.target.value },
                    })
                  }
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="label-text">Emergency Contact Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={contactInfo.emergencyContact?.phone || ''}
                  onChange={(e) =>
                    setContactInfo({
                      ...contactInfo,
                      emergencyContact: { ...contactInfo.emergencyContact, phone: e.target.value },
                    })
                  }
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="label-text">Relationship</label>
                <input
                  type="text"
                  className="input-field"
                  value={contactInfo.emergencyContact?.relationship || ''}
                  onChange={(e) =>
                    setContactInfo({
                      ...contactInfo,
                      emergencyContact: { ...contactInfo.emergencyContact, relationship: e.target.value },
                    })
                  }
                  placeholder="e.g. Spouse, Parent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleNext} className="btn-primary">
          Next: Extras →
        </button>
      </div>
    </div>
  );
};

// ─── Step 1: Extras & Add-ons ──────────────────────────────────────────────
const StepExtras = ({ onNext, onBack }) => {
  const { extras, toggleExtra, passengers } = useBookingStore();
  const [bagCount, setBagCount] = useState(1);
  const paxCount = passengers.filter((p) => p.type !== 'infant').length || 1;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Make Your Journey Even Better</h2>

      <div className="grid md:grid-cols-2 gap-4">
        {EXTRAS_CONFIG.map((item) => {
          const isSelected = extras[item.key];
          return (
            <div
              key={item.key}
              onClick={() => toggleExtra(item.key)}
              className={`rounded-2xl p-5 cursor-pointer transition-all duration-150 select-none
                ${isSelected
                  ? 'border-2 border-primary-500 bg-primary-50'
                  : 'border border-gray-200 bg-white hover:border-gray-300'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                    + {fmt(item.price * paxCount)}
                  </p>
                  <p className="text-xs text-gray-400">{fmt(item.price)}/person</p>
                </div>
              </div>

              {/* Bag counter for extra baggage */}
              {item.hasCounter && isSelected && (
                <div
                  className="mt-3 flex items-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-xs text-gray-600 font-medium">Bags:</span>
                  <button
                    type="button"
                    onClick={() => setBagCount((n) => Math.max(1, n - 1))}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary-400"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{bagCount}</span>
                  <button
                    type="button"
                    onClick={() => setBagCount((n) => Math.min(3, n + 1))}
                    className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-primary-400"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-500 ml-1">
                    = {fmt(item.price * bagCount * paxCount)} total
                  </span>
                </div>
              )}

              {/* Selection indicator */}
              <div className={`mt-3 text-xs font-semibold flex items-center gap-1 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`}>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300'}`}
                >
                  {isSelected ? '✓' : ''}
                </span>
                {isSelected ? 'Added' : 'Add to booking'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">
          ← Back
        </button>
        <button onClick={onNext} className="btn-primary">
          Next: Review →
        </button>
      </div>
    </div>
  );
};

// ─── Step 2: Review ────────────────────────────────────────────────────────
const StepReview = ({ onNext, onBack, isSubmitting }) => {
  const { flight, returnFlight, seatClass, passengers, contactInfo, extras, selectedSeats, computeTotal } = useBookingStore();
  const [agreed, setAgreed] = useState(false);

  const pricing = computeTotal();
  const airline = flight?.airline || {};
  const originCode = flight?.origin?.code || '---';
  const originCity = flight?.origin?.city || '';
  const destCode = flight?.destination?.code || '---';
  const destCity = flight?.destination?.city || '';
  const depTime = flight?.departureTime;
  const arrTime = flight?.arrivalTime;
  const EXTRAS_PRICING = { extraBaggage: 1299, travelInsurance: 499, mealUpgrade: 299, priorityBoarding: 199 };
  const EXTRAS_LABELS = { extraBaggage: 'Extra Baggage', travelInsurance: 'Travel Insurance', mealUpgrade: 'Meal Upgrade', priorityBoarding: 'Priority Boarding' };
  const selectedExtras = Object.entries(extras).filter(([, v]) => v);
  const paxCount = passengers.filter((p) => p.type !== 'infant').length || 1;
  const baseFare = flight?.seats?.[seatClass]?.price || 0;
  const adults = passengers.filter((p) => p.type === 'adult');
  const children = passengers.filter((p) => p.type === 'child');
  const infants = passengers.filter((p) => p.type === 'infant');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Review Your Booking</h2>

      {/* Flight Details */}
      <div className="card mb-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary-500" /> {returnFlight ? 'Outbound Flight' : 'Flight Details'}
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
          <span><span className="text-gray-500">Airline:</span> {airline.name || '--'}</span>
          <span>
            <span className="text-gray-500">Route:</span>{' '}
            {originCity ? `${originCity} (${originCode})` : originCode}
            {' → '}
            {destCity ? `${destCity} (${destCode})` : destCode}
          </span>
          <span><span className="text-gray-500">Date:</span> {fmtDate(depTime)}</span>
          <span>
            <span className="text-gray-500">Time:</span>{' '}
            {fmtTime(depTime)} – {fmtTime(arrTime)}
          </span>
          <span className="capitalize"><span className="text-gray-500">Class:</span> {seatClass}</span>
          {selectedSeats.length > 0 && (
            <span><span className="text-gray-500">Seats:</span> {selectedSeats.join(', ')}</span>
          )}
        </div>
        {returnFlight && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Plane className="w-4 h-4 text-primary-500 rotate-180" /> Return Flight
            </h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
              <span><span className="text-gray-500">Airline:</span> {returnFlight.airline?.name || '--'}</span>
              <span>
                <span className="text-gray-500">Route:</span>{' '}
                {returnFlight.origin?.city ? `${returnFlight.origin.city} (${returnFlight.origin?.code})` : returnFlight.origin?.code}
                {' → '}
                {returnFlight.destination?.city ? `${returnFlight.destination.city} (${returnFlight.destination?.code})` : returnFlight.destination?.code}
              </span>
              <span><span className="text-gray-500">Date:</span> {fmtDate(returnFlight.departureTime)}</span>
              <span><span className="text-gray-500">Time:</span> {fmtTime(returnFlight.departureTime)} – {fmtTime(returnFlight.arrivalTime)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Passengers */}
      <div className="card mb-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-500" /> Passengers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 rounded-lg">
              <tr>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">#</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Name</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Type</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Seat</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Meal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {passengers.map((p, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-800 font-medium">{p.title} {p.firstName} {p.lastName}</td>
                  <td className="px-3 py-2 capitalize">
                    <span className={`badge-${p.type === 'adult' ? 'info' : p.type === 'child' ? 'warning' : 'success'}`}>
                      {p.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{selectedSeats[i] || '—'}</td>
                  <td className="px-3 py-2 text-gray-600 capitalize">{(p.mealPreference || 'standard').replace('-', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Extras */}
      <div className="card mb-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Extras</h3>
        {selectedExtras.length > 0 ? (
          <div className="space-y-2">
            {selectedExtras.map(([k]) => (
              <div key={k} className="flex items-center justify-between text-sm text-gray-700">
                <span>{EXTRAS_LABELS[k]}</span>
                <span>{fmt(EXTRAS_PRICING[k] * paxCount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No extras selected</p>
        )}
      </div>

      {/* Contact */}
      <div className="card mb-0">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Details</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
          <span><span className="text-gray-500">Email:</span> {contactInfo.email || '--'}</span>
          <span><span className="text-gray-500">Phone:</span> +91 {contactInfo.phone || '--'}</span>
        </div>
      </div>

      {/* Price Breakdown card */}
      <div className="card border-primary-200 border-2 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Price Breakdown</h3>

        {adults.length > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>{adults.length} Adult{adults.length > 1 ? 's' : ''} × {fmt(baseFare)}</span>
            <span>{fmt(adults.length * baseFare)}</span>
          </div>
        )}
        {children.length > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>{children.length} Child{children.length > 1 ? 'ren' : ''} × {fmt(Math.round(baseFare * 0.75))}</span>
            <span>{fmt(children.length * Math.round(baseFare * 0.75))}</span>
          </div>
        )}
        {infants.length > 0 && (
          <div className="flex justify-between text-sm text-gray-700">
            <span>{infants.length} Infant{infants.length > 1 ? 's' : ''} × {fmt(Math.round(baseFare * 0.1))}</span>
            <span>{fmt(infants.length * Math.round(baseFare * 0.1))}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-gray-600">
          <span>Taxes & Fees (18% GST)</span>
          <span>{fmt(pricing.taxes)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Fuel Surcharge</span>
          <span>{fmt(pricing.fuelSurcharge)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Convenience Fee</span>
          <span>{fmt(pricing.convenienceFee)}</span>
        </div>
        {pricing.extrasTotal > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Extras</span>
            <span>{fmt(pricing.extrasTotal)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 mt-2">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-bold text-gray-900">TOTAL AMOUNT</span>
            <span className="text-2xl font-bold text-primary-700">{fmt(pricing.totalAmount)}</span>
          </div>
          <p className="text-xs text-gray-400 text-right mt-1">Inclusive of all taxes and fees</p>
        </div>
      </div>

      {/* Agreement */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-primary-600"
        />
        <span className="text-sm text-gray-600">
          I agree to the{' '}
          <span className="text-primary-600 underline cursor-pointer">fare rules</span> and{' '}
          <span className="text-primary-600 underline cursor-pointer">cancellation policy</span>
        </span>
      </label>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">
          ← Back
        </button>
        <button
          onClick={() => {
            if (!agreed) { toast.error('Please agree to the fare rules before proceeding'); return; }
            onNext();
          }}
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Processing…' : 'Proceed to Payment →'}
        </button>
      </div>
    </div>
  );
};

// ─── Booking Page ─────────────────────────────────────────────────────────
const BookingPage = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const seatClassParam = searchParams.get('class') || 'economy';
  const adults = parseInt(searchParams.get('adults') || '1', 10);
  const children = parseInt(searchParams.get('children') || '0', 10);
  const infants = parseInt(searchParams.get('infants') || '0', 10);
  const tripType = searchParams.get('tripType') || 'one-way';
  const returnFlightId = searchParams.get('returnFlightId') || null;

  const {
    flight,
    returnFlight,
    seatClass,
    passengers,
    contactInfo,
    extras,
    selectedSeats,
    currentStep,
    nextStep,
    prevStep,
    setStep,
    setFlight,
    setReturnFlight,
    setSeatClass,
    setSearchParams: storeSearchParams,
    initPassengers,
    updatePassenger,
    setContactInfo,
    computeTotal,
  } = useBookingStore();

  const [pageLoading, setPageLoading] = useState(!flight);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prefillFromProfile = (profile) => {
    if (!profile) return;
    const nameParts = (profile.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const title = profile.gender === 'female' ? 'Ms' : 'Mr';
    const fmtDate = (d) => { try { return format(parseISO(d), 'yyyy-MM-dd'); } catch { return ''; } };

    updatePassenger(0, {
      firstName,
      lastName,
      title,
      gender: profile.gender || 'male',
      nationality: profile.nationality || 'Indian',
      dateOfBirth: profile.dateOfBirth ? fmtDate(profile.dateOfBirth) : '',
      passportNumber: profile.passportNumber || '',
      passportExpiry: profile.passportExpiry ? fmtDate(profile.passportExpiry) : '',
      mealPreference: profile.preferences?.mealPreference || 'standard',
    });

    const phone = (profile.phone || '').replace(/^\+91\s?/, '').replace(/\s/g, '');
    setContactInfo({
      email: profile.email || '',
      phone,
      emergencyContact: {
        name: profile.emergencyContact?.name || '',
        phone: profile.emergencyContact?.phone || '',
      },
    });
  };

  // Initialise store (handles direct URL access)
  useEffect(() => {
    const init = async () => {
      setSeatClass(seatClassParam);
      storeSearchParams({ adults, children, infants, tripType });

      if (!flight || flight._id !== flightId) {
        try {
          setPageLoading(true);
          const [outRes, retRes] = await Promise.all([
            flightApi.get(`/${flightId}`, { params: { class: seatClassParam } }),
            returnFlightId ? flightApi.get(`/${returnFlightId}`, { params: { class: seatClassParam } }) : Promise.resolve(null),
          ]);
          const outData = outRes.data?.data || outRes.data;
          setFlight(outData.flight || outData);
          if (retRes) {
            const retData = retRes.data?.data || retRes.data;
            setReturnFlight(retData.flight || retData);
          } else {
            setReturnFlight(null);
          }
          initPassengers(adults, children, infants);
        } catch (err) {
          toast.error('Failed to load flight. Please try again.');
          navigate(-1);
        } finally {
          setPageLoading(false);
        }
      } else {
        if (returnFlightId && (!returnFlight || returnFlight._id !== returnFlightId)) {
          flightApi.get(`/${returnFlightId}`, { params: { class: seatClassParam } })
            .then(r => { const d = r.data?.data || r.data; setReturnFlight(d.flight || d); })
            .catch(() => {});
        }
        if (passengers.length === 0) initPassengers(adults, children, infants);
        setPageLoading(false);
      }

      setStep(0);

      // Pre-fill first passenger + contact info from saved profile
      authApi.get('/me').then(r => {
        const profile = r.data.data?.user || r.data.user;
        if (profile) prefillFromProfile(profile);
      }).catch(() => {});
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        flightId: flight._id || flightId,
        ...(returnFlightId ? { returnFlightId } : {}),
        tripType,
        class: seatClass,
        passengers: passengers.map((p, i) => ({
          ...p,
          seatNumber: selectedSeats[i] || '',
        })),
        contactInfo,
        extras,
      };
      const res = await bookingApi.post('/', payload);
      // API returns { success, data: { booking, clientSecret } }
      const responseData = res.data?.data || res.data;
      const booking = responseData.booking || responseData;
      const bookingId = booking._id || booking.id;
      toast.success('Booking created! Proceed to payment.');
      navigate(`/payment/${bookingId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pricing = computeTotal();

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading booking…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-900">Complete Your Booking</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* Step indicator */}
        <BookingStepIndicator currentStep={currentStep} steps={STEPS} />

        <div className="lg:flex lg:gap-8 lg:items-start">
          {/* ── Step content ── */}
          <div className="flex-1">
            {currentStep === 0 && (
              <StepTraveller onNext={nextStep} />
            )}
            {currentStep === 1 && (
              <StepExtras onNext={nextStep} onBack={prevStep} />
            )}
            {currentStep === 2 && (
              <StepReview onNext={handleSubmit} onBack={prevStep} isSubmitting={isSubmitting} />
            )}
            {currentStep === 3 && (
              // Payment step is handled by submit on step 2; this is a fallback
              <div className="card text-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto mb-3" />
                <p className="text-gray-600">Redirecting to payment…</p>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="hidden lg:block w-72 shrink-0 sticky top-20 space-y-4">
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">Your Booking</h3>
              <FlightSummaryBar flight={flight} returnFlight={returnFlight} seatClass={seatClass} />
              <PriceBreakdown pricing={pricing} />
            </div>

            {/* Support link */}
            <div className="card flex items-center gap-3 text-sm text-gray-600">
              <MessageCircle className="w-5 h-5 text-primary-400 shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Need help?</p>
                <a
                  href="mailto:support@flightbooking.com"
                  className="text-primary-600 hover:underline text-xs"
                >
                  Chat with support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile price bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-lg font-bold text-primary-700">{fmt(pricing.totalAmount)}</p>
          </div>
          <PriceBreakdown pricing={pricing} />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
