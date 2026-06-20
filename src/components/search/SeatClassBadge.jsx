const CLASS_STYLES = {
  economy: 'bg-gray-100 text-gray-600',
  business: 'bg-primary-50 text-primary-700',
  first: 'bg-amber-50 text-amber-700',
};

const CLASS_LABELS = { economy: 'Economy', business: 'Business', first: 'First' };

const SeatClassBadge = ({ seatClass, className = '' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CLASS_STYLES[seatClass] || CLASS_STYLES.economy} ${className}`}>
    {CLASS_LABELS[seatClass] || seatClass}
  </span>
);

export default SeatClassBadge;
