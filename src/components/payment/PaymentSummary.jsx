import { format } from 'date-fns';
import { Plane, Users } from 'lucide-react';

const PaymentSummary = ({ booking }) => {
  if (!booking) return null;
  const { flight, class: seatClass, passengers = [], pricing } = booking;
  const dep = flight?.departureTime ? new Date(flight.departureTime) : null;
  const arr = flight?.arrivalTime ? new Date(flight.arrivalTime) : null;
  const duration = flight?.duration || 0;

  const adultCount = passengers.filter(p => p.type === 'adult').length;
  const childCount = passengers.filter(p => p.type === 'child').length;
  const infantCount = passengers.filter(p => p.type === 'infant').length;

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-gray-900">Order Summary</h3>

      {/* Flight info */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {flight?.airline?.name?.slice(0, 2).toUpperCase() || 'FL'}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">{flight?.airline?.name}</p>
            <p className="text-xs text-gray-400">{flight?.flightNumber}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{dep ? format(dep, 'HH:mm') : '--:--'}</p>
            <p className="text-sm font-semibold text-gray-600">{flight?.origin?.code}</p>
            <p className="text-xs text-gray-400">{flight?.origin?.city}</p>
          </div>
          <div className="flex-1 flex flex-col items-center px-2">
            <p className="text-xs text-gray-400">{Math.floor(duration / 60)}h {duration % 60}m</p>
            <div className="flex items-center gap-1 w-full">
              <div className="flex-1 h-px bg-gray-300" />
              <Plane className="w-3 h-3 text-gray-400" />
              <div className="flex-1 h-px bg-gray-300" />
            </div>
            <p className="text-xs text-gray-400">Non-stop</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{arr ? format(arr, 'HH:mm') : '--:--'}</p>
            <p className="text-sm font-semibold text-gray-600">{flight?.destination?.code}</p>
            <p className="text-xs text-gray-400">{flight?.destination?.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="capitalize">{seatClass} Class</span>
          <span>·</span>
          <span>{dep ? format(dep, 'EEE, dd MMM yyyy') : ''}</span>
        </div>
      </div>

      {/* Passengers */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Users className="w-4 h-4 text-gray-400" />
        <span>
          {[
            adultCount > 0 && `${adultCount} Adult${adultCount > 1 ? 's' : ''}`,
            childCount > 0 && `${childCount} Child${childCount > 1 ? 'ren' : ''}`,
            infantCount > 0 && `${infantCount} Infant${infantCount > 1 ? 's' : ''}`,
          ].filter(Boolean).join(', ')}
        </span>
      </div>

      {/* Price breakdown */}
      <div className="border-t border-gray-100 pt-3 space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Base Fare</span>
          <span>₹{(pricing?.basePrice || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>Taxes &amp; Fees</span>
          <span>₹{((pricing?.taxes || 0) + (pricing?.fees || 0)).toLocaleString('en-IN')}</span>
        </div>
        {(pricing?.extras || 0) > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>Extras</span>
            <span>₹{(pricing.extras).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
          <span>Total</span>
          <span className="text-primary-700">₹{(pricing?.totalAmount || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
