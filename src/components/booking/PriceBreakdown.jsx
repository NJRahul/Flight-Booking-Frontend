import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const fmt = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const PriceBreakdown = ({ pricing }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!pricing) return null;

  const {
    baseTotal = 0,
    taxes = 0,
    fuelSurcharge = 0,
    convenienceFee = 99,
    extrasTotal = 0,
    totalAmount = 0,
    passengers = [],
    baseFare = 0,
  } = pricing;

  const adults = passengers.filter((p) => p.type === 'adult');
  const children = passengers.filter((p) => p.type === 'child');
  const infants = passengers.filter((p) => p.type === 'infant');

  const adultFare = baseFare;
  const childFare = Math.round(baseFare * 0.75);
  const infantFare = Math.round(baseFare * 0.1);

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">Price Breakdown</span>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-primary-700">{fmt(totalAmount)}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          {/* Per-passenger lines */}
          {adults.length > 0 && (
            <div className="flex justify-between text-sm text-gray-700">
              <span>
                {adults.length} Adult{adults.length > 1 ? 's' : ''} × {fmt(adultFare)}
              </span>
              <span>{fmt(adults.length * adultFare)}</span>
            </div>
          )}
          {children.length > 0 && (
            <div className="flex justify-between text-sm text-gray-700">
              <span>
                {children.length} Child{children.length > 1 ? 'ren' : ''} × {fmt(childFare)}
              </span>
              <span>{fmt(children.length * childFare)}</span>
            </div>
          )}
          {infants.length > 0 && (
            <div className="flex justify-between text-sm text-gray-700">
              <span>
                {infants.length} Infant{infants.length > 1 ? 's' : ''} × {fmt(infantFare)}
              </span>
              <span>{fmt(infants.length * infantFare)}</span>
            </div>
          )}

          {/* Taxes & fees */}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Taxes & Fees (18% GST)</span>
            <span>{fmt(taxes)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Fuel Surcharge</span>
            <span>{fmt(fuelSurcharge)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Convenience Fee</span>
            <span>{fmt(convenienceFee)}</span>
          </div>

          {extrasTotal > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Extras</span>
              <span>{fmt(extrasTotal)}</span>
            </div>
          )}

          {/* Divider + total */}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-gray-900">Total Amount</span>
              <span className="text-xl font-bold text-primary-700">{fmt(totalAmount)}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">
              All prices in INR · Inclusive of taxes
            </p>
          </div>
        </div>
      </div>

      {/* Collapsed summary */}
      {!isOpen && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400">All prices in INR · Inclusive of taxes</p>
        </div>
      )}
    </div>
  );
};

export default PriceBreakdown;
