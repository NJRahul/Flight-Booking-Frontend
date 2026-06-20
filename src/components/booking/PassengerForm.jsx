import { format, subYears, subMonths } from 'date-fns';

const NATIONALITIES = [
  'Indian', 'American', 'British', 'Australian', 'Canadian', 'Chinese',
  'French', 'German', 'Japanese', 'Singaporean', 'UAE', 'Saudi Arabian',
  'Brazilian', 'South Korean', 'Italian', 'Spanish', 'Mexican', 'Russian',
  'Dutch', 'Swedish', 'Swiss', 'Norwegian', 'Danish', 'Belgian', 'Austrian',
  'New Zealander', 'South African', 'Malaysian', 'Thai', 'Indonesian',
  'Filipino', 'Vietnamese', 'Bangladeshi', 'Sri Lankan', 'Pakistani',
  'Nepali', 'Other',
];

const MEAL_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'diabetic', label: 'Diabetic' },
  { value: 'no-meal', label: 'No Meal' },
];

const today = format(new Date(), 'yyyy-MM-dd');

const getDoB = (type) => {
  if (type === 'adult') return { max: format(subYears(new Date(), 18), 'yyyy-MM-dd'), min: '' };
  if (type === 'child') return {
    max: format(subYears(new Date(), 2), 'yyyy-MM-dd'),
    min: format(subYears(new Date(), 12), 'yyyy-MM-dd'),
  };
  // infant
  return {
    max: today,
    min: format(subMonths(new Date(), 23), 'yyyy-MM-dd'),
  };
};

const PassengerForm = ({
  passenger,
  passengerIndex,
  passengerType,
  onUpdate,
  errors = {},
}) => {
  const typeLabel =
    passengerType === 'child' ? 'Child' : passengerType === 'infant' ? 'Infant' : 'Adult';

  const dob = getDoB(passengerType);

  const handleChange = (field, value) => {
    onUpdate(passengerIndex, { [field]: value });
  };

  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="text-xs text-danger-500 mt-0.5">{errors[field]}</p>
    ) : null;

  return (
    <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
          Passenger {passengerIndex + 1} — {typeLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className="label-text">Title</label>
          <select
            className="select-field"
            value={passenger.title || 'Mr'}
            onChange={(e) => handleChange('title', e.target.value)}
          >
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
            <option value="Dr">Dr</option>
          </select>
        </div>

        {/* First Name */}
        <div>
          <label className="label-text">First Name *</label>
          <input
            type="text"
            className={`input-field ${errors.firstName ? 'border-danger-500 focus:ring-danger-400' : ''}`}
            placeholder="As on passport"
            value={passenger.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
          />
          <FieldError field="firstName" />
        </div>

        {/* Last Name */}
        <div>
          <label className="label-text">Last Name *</label>
          <input
            type="text"
            className={`input-field ${errors.lastName ? 'border-danger-500 focus:ring-danger-400' : ''}`}
            placeholder="As on passport"
            value={passenger.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
          />
          <FieldError field="lastName" />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="label-text">Date of Birth *</label>
          <input
            type="date"
            className={`input-field ${errors.dateOfBirth ? 'border-danger-500 focus:ring-danger-400' : ''}`}
            value={passenger.dateOfBirth || ''}
            max={dob.max}
            min={dob.min || undefined}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
          />
          <FieldError field="dateOfBirth" />
        </div>

        {/* Gender */}
        <div className="md:col-span-2">
          <label className="label-text">Gender *</label>
          <div className="flex gap-2 flex-wrap mt-1">
            {['male', 'female', 'other'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleChange('gender', g)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 capitalize
                  ${
                    passenger.gender === g
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-600'
                  }`}
              >
                {g}
              </button>
            ))}
          </div>
          <FieldError field="gender" />
        </div>

        {/* Nationality */}
        <div>
          <label className="label-text">Nationality</label>
          <select
            className="select-field"
            value={passenger.nationality || 'Indian'}
            onChange={(e) => handleChange('nationality', e.target.value)}
          >
            {NATIONALITIES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        {/* Passport Number — not required for infants */}
        {passengerType !== 'infant' && (
          <div>
            <label className="label-text">Passport Number *</label>
            <input
              type="text"
              className={`input-field uppercase ${errors.passportNumber ? 'border-danger-500 focus:ring-danger-400' : ''}`}
              placeholder="e.g. N1234567"
              value={passenger.passportNumber || ''}
              onChange={(e) => handleChange('passportNumber', e.target.value.toUpperCase())}
            />
            <FieldError field="passportNumber" />
          </div>
        )}

        {/* Passport Expiry */}
        <div>
          <label className="label-text">Passport Expiry Date</label>
          <input
            type="date"
            className="input-field"
            value={passenger.passportExpiry || ''}
            min={today}
            onChange={(e) => handleChange('passportExpiry', e.target.value)}
          />
        </div>

        {/* Meal Preference */}
        <div>
          <label className="label-text">Meal Preference</label>
          <select
            className="select-field"
            value={passenger.mealPreference || 'standard'}
            onChange={(e) => handleChange('mealPreference', e.target.value)}
          >
            {MEAL_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Special Assistance — full width */}
        <div className="md:col-span-2">
          <label className="label-text">Special Assistance (optional)</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Wheelchair, Hearing aid, etc."
            value={passenger.specialAssistance || ''}
            onChange={(e) => handleChange('specialAssistance', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default PassengerForm;
