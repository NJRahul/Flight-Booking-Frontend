export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  FLIGHT_DETAILS: '/flights/:id',
  BOOKING: '/booking',
  BOOKING_CONFIRM: '/booking/confirm',
  BOOKING_SUCCESS: '/booking/success/:id',
  BOOKING_HISTORY: '/bookings',
  BOOKING_DETAIL: '/bookings/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_FLIGHTS: '/admin/flights',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_USERS: '/admin/users',
  ADMIN_REVENUE: '/admin/revenue',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  NOT_FOUND: '*',
};

export const SEAT_CLASSES = [
  {
    value: 'economy',
    label: 'Economy',
    multiplier: 1,
    description: 'Standard seating with essential amenities',
  },
  {
    value: 'business',
    label: 'Business',
    multiplier: 3,
    description: 'Premium seating with extra comfort and services',
  },
  {
    value: 'first',
    label: 'First Class',
    multiplier: 6,
    description: 'Luxury seating with exclusive services',
  },
];

export const MEAL_PREFERENCES = [
  { value: 'standard', label: 'Standard Meal' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'gluten-free', label: 'Gluten Free' },
  { value: 'diabetic', label: 'Diabetic' },
  { value: 'low-sodium', label: 'Low Sodium' },
  { value: 'no-meal', label: 'No Meal' },
];

export const NATIONALITIES = [
  'Afghan', 'Albanian', 'Algerian', 'American', 'Argentinian', 'Australian', 'Austrian',
  'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Bulgarian', 'Canadian', 'Chilean',
  'Chinese', 'Colombian', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Egyptian', 'Emirati',
  'Ethiopian', 'Finnish', 'French', 'German', 'Ghanaian', 'Greek', 'Hungarian', 'Indian',
  'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Israeli', 'Italian', 'Japanese', 'Jordanian',
  'Kenyan', 'Korean', 'Malaysian', 'Mexican', 'Moroccan', 'New Zealander', 'Nigerian',
  'Norwegian', 'Pakistani', 'Philippine', 'Polish', 'Portuguese', 'Romanian', 'Russian',
  'Saudi', 'Singaporean', 'South African', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss',
  'Thai', 'Turkish', 'Ukrainian', 'Venezuelan', 'Vietnamese',
];

export const QUERY_KEYS = {
  FLIGHTS: 'flights',
  FLIGHT: 'flight',
  BOOKINGS: 'bookings',
  BOOKING: 'booking',
  USER: 'user',
  USERS: 'users',
  NOTIFICATIONS: 'notifications',
  AIRPORTS: 'airports',
  ADMIN_STATS: 'adminStats',
  ADMIN_BOOKINGS: 'adminBookings',
  ADMIN_FLIGHTS: 'adminFlights',
  ADMIN_USERS: 'adminUsers',
  ADMIN_REVENUE: 'adminRevenue',
};
