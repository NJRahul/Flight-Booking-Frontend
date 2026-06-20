import { formatCurrency } from '../../utils/formatters';

const PriceDisplay = ({ price, originalPrice, className = '' }) => {
  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <span className={`inline-flex flex-col items-end ${className}`}>
      {hasDiscount && (
        <span className="text-xs text-gray-400 line-through leading-none mb-0.5">
          {formatCurrency(originalPrice)}
        </span>
      )}
      <span className="font-bold text-primary-700 leading-none">
        {formatCurrency(price)}
      </span>
      {hasDiscount && (
        <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700">
          {Math.round(((originalPrice - price) / originalPrice) * 100)}% off
        </span>
      )}
    </span>
  );
};

export default PriceDisplay;
