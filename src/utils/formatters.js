import { format } from 'date-fns';

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '';
  try {
    return format(new Date(date), fmt);
  } catch {
    return '';
  }
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes < 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'HH:mm');
  } catch {
    return '';
  }
};

export const formatFlightNumber = (code, number) => {
  if (!code || !number) return '';
  return `${code}-${number}`;
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.slice(0, length)}...` : str;
};

export const formatPassengerCount = (adults = 0, children = 0, infants = 0) => {
  const parts = [];
  if (adults > 0) parts.push(`${adults} Adult${adults > 1 ? 's' : ''}`);
  if (children > 0) parts.push(`${children} Child${children > 1 ? 'ren' : ''}`);
  if (infants > 0) parts.push(`${infants} Infant${infants > 1 ? 's' : ''}`);
  return parts.join(', ') || '1 Adult';
};

export const getStatusColor = (status) => {
  const map = {
    scheduled: 'text-blue-600 bg-blue-50',
    delayed: 'text-yellow-600 bg-yellow-50',
    cancelled: 'text-red-600 bg-red-50',
    boarding: 'text-purple-600 bg-purple-50',
    departed: 'text-green-600 bg-green-50',
    landed: 'text-gray-600 bg-gray-50',
    pending: 'text-yellow-600 bg-yellow-50',
    confirmed: 'text-green-600 bg-green-50',
    completed: 'text-gray-600 bg-gray-50',
  };
  return map[status?.toLowerCase()] || 'text-gray-600 bg-gray-50';
};
