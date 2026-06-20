import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaneTakeoff, PlaneLanding, ArrowLeftRight, Calendar, Users, ChevronDown, Search, Plus, Minus } from 'lucide-react';
import { format, addDays } from 'date-fns';
import AirportAutocomplete from './AirportAutocomplete';
import { ROUTES } from '../../utils/constants';

const TRIP_LABELS = { 'one-way': 'One Way', 'round-trip': 'Round Trip' };

const PassengerSelector = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const { adults, children, infants } = value;

  const adjust = (key, delta) => {
    const next = { ...value, [key]: Math.max(key === 'adults' ? 1 : 0, value[key] + delta) };
    if (next.infants > next.adults) next.infants = next.adults;
    if (next.adults + next.children > 9) return;
    onChange(next);
  };

  const label = (() => {
    const pax = adults + children;
    const parts = [`${pax} Passenger${pax !== 1 ? 's' : ''}`];
    if (infants > 0) parts.push(`${infants} Infant${infants !== 1 ? 's' : ''}`);
    return parts.join(', ');
  })();

  return (
    <div className="relative">
      <label className="label-text">Passengers</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input-field flex items-center justify-between gap-2 w-full text-left h-11"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm truncate">{label}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-modal border border-gray-100 p-4">
          {[
            { key: 'adults', label: 'Adults', sub: '12 years and above' },
            { key: 'children', label: 'Children', sub: '2 – 11 years' },
            { key: 'infants', label: 'Infants', sub: 'Under 2 years' },
          ].map(({ key, label: l, sub }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-navy-900">{l}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjust(key, -1)}
                  disabled={value[key] <= (key === 'adults' ? 1 : 0)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center text-sm font-semibold">{value[key]}</span>
                <button
                  type="button"
                  onClick={() => adjust(key, 1)}
                  disabled={(key === 'infants' && value.infants >= value.adults) || (key !== 'infants' && value.adults + value.children >= 9)}
                  className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full mt-3 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

const today = format(new Date(), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const weekOut = format(addDays(new Date(), 8), 'yyyy-MM-dd');

const FlightSearchWidget = ({ initialValues = {} }) => {
  const navigate = useNavigate();

  const [tripType, setTripType] = useState(initialValues.tripType || 'one-way');
  const [from, setFrom] = useState(
    initialValues.from
      ? { code: initialValues.from, city: initialValues.fromCity || initialValues.from, display: initialValues.fromCity ? `${initialValues.fromCity} (${initialValues.from})` : initialValues.from }
      : null
  );
  const [to, setTo] = useState(
    initialValues.to
      ? { code: initialValues.to, city: initialValues.toCity || initialValues.to, display: initialValues.toCity ? `${initialValues.toCity} (${initialValues.to})` : initialValues.to }
      : null
  );
  const [departureDate, setDepartureDate] = useState(initialValues.departureDate || tomorrow);
  const [returnDate, setReturnDate] = useState(initialValues.returnDate || weekOut);
  const [passengers, setPassengers] = useState({
    adults: parseInt(initialValues.adults) || 1,
    children: parseInt(initialValues.children) || 0,
    infants: parseInt(initialValues.infants) || 0,
  });
  const [seatClass, setSeatClass] = useState(initialValues.class || 'economy');
  const [errors, setErrors] = useState({});
  const [swapping, setSwapping] = useState(false);

  const handleSwap = () => {
    setSwapping(true);
    setTimeout(() => setSwapping(false), 300);
    setFrom(to);
    setTo(from);
  };

  const validate = () => {
    const errs = {};
    if (!from) errs.from = 'Select origin airport';
    if (!to) errs.to = 'Select destination airport';
    if (from && to && from.code === to.code) errs.to = 'Origin and destination must differ';
    if (!departureDate) errs.departureDate = 'Select departure date';
    if (tripType === 'round-trip' && !returnDate) errs.returnDate = 'Select return date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const params = new URLSearchParams({
      from: from.code,
      fromCity: from.city || from.code,
      to: to.code,
      toCity: to.city || to.code,
      departureDate,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      class: seatClass,
      tripType,
    });
    if (tripType === 'round-trip' && returnDate) params.set('returnDate', returnDate);

    navigate(`${ROUTES.SEARCH}?${params}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      {/* Trip type tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {Object.entries(TRIP_LABELS).map(([type, label]) => (
          <button
            key={type}
            type="button"
            onClick={() => setTripType(type)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${tripType === type ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearch} noValidate>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          {/* FROM */}
          <div className="flex-1 min-w-0">
            <AirportAutocomplete value={from} onChange={setFrom} placeholder="City or airport" icon={PlaneTakeoff} label="From" exclude={to} error={!!errors.from} />
            {errors.from && <p className="text-xs text-danger-500 mt-1">{errors.from}</p>}
          </div>

          {/* Swap */}
          <div className="self-end pb-0.5 hidden lg:block">
            <button
              type="button"
              onClick={handleSwap}
              className={`w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary-400 hover:text-primary-600 transition-all duration-300 ${swapping ? 'rotate-180' : ''}`}
            >
              <ArrowLeftRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* TO */}
          <div className="flex-1 min-w-0">
            <AirportAutocomplete value={to} onChange={setTo} placeholder="City or airport" icon={PlaneLanding} label="To" exclude={from} error={!!errors.to} />
            {errors.to && <p className="text-xs text-danger-500 mt-1">{errors.to}</p>}
          </div>

          {/* Departure Date */}
          <div className="flex-1 min-w-0">
            <label className="label-text">Departure Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
              <input
                type="date"
                value={departureDate}
                min={today}
                onChange={(e) => setDepartureDate(e.target.value)}
                className={`input-field pl-10 w-full ${errors.departureDate ? 'border-danger-500' : ''}`}
              />
            </div>
            {errors.departureDate && <p className="text-xs text-danger-500 mt-1">{errors.departureDate}</p>}
          </div>

          {/* Return Date */}
          {tripType === 'round-trip' && (
            <div className="flex-1 min-w-0">
              <label className="label-text">Return Date</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate || today}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className={`input-field pl-10 w-full ${errors.returnDate ? 'border-danger-500' : ''}`}
                />
              </div>
              {errors.returnDate && <p className="text-xs text-danger-500 mt-1">{errors.returnDate}</p>}
            </div>
          )}

          {/* Passengers */}
          <div className="flex-1 min-w-0">
            <PassengerSelector value={passengers} onChange={setPassengers} />
          </div>

          {/* Class */}
          <div className="flex-1 min-w-0">
            <label className="label-text">Class</label>
            <select value={seatClass} onChange={(e) => setSeatClass(e.target.value)} className="select-field w-full h-11">
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>

          {/* Search button */}
          <button type="submit" className="btn-primary h-11 px-8 flex items-center gap-2 whitespace-nowrap shrink-0">
            <Search className="w-4 h-4" />
            Search Flights
          </button>
        </div>
      </form>
    </div>
  );
};

export default FlightSearchWidget;
