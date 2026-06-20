import { useState, useEffect } from 'react';
import { format, addMinutes, parseISO } from 'date-fns';
import { Clock, XCircle, PlaneTakeoff, CheckCircle, Loader2 } from 'lucide-react';
import useFlightStatus from '../../hooks/useFlightStatus';

const STATUS_CONFIG = {
  scheduled: { color: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-400', label: 'Scheduled' },
  boarding:  { color: 'bg-green-50 border-green-200 text-green-800', dot: 'bg-green-500 animate-pulse', label: 'Boarding' },
  departed:  { color: 'bg-gray-50 border-gray-200 text-gray-600', dot: 'bg-gray-400', label: 'Departed' },
  arrived:   { color: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-400', label: 'Arrived' },
  delayed:   { color: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500 animate-pulse', label: 'Delayed' },
  cancelled: { color: 'bg-red-50 border-red-200 text-red-800', dot: 'bg-red-500', label: 'Cancelled' },
};

const RealTimeFlightStatus = ({ flightId, initialStatus = 'scheduled', initialDelay = 0, initialGate = null, departureTime }) => {
  const { status, delay, gate, updatedAt, isDelayed, isCancelled, isBoarding } = useFlightStatus({
    flightId,
    initialStatus,
    initialDelay,
    initialGate,
  });

  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    setShowBanner(true);
    if (status === 'scheduled' || status === 'departed' || status === 'arrived') return;
    // Auto-dismiss info banners (boarding) after 10s; keep warnings
    if (status === 'boarding') {
      const t = setTimeout(() => setShowBanner(false), 10000);
      return () => clearTimeout(t);
    }
  }, [status]);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;

  const newDeparture =
    isDelayed && departureTime && delay > 0
      ? format(addMinutes(new Date(departureTime), delay), 'HH:mm')
      : null;

  return (
    <div className="space-y-2">
      {/* Status pill */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${cfg.color}`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        {cfg.label}
        {isDelayed && delay > 0 && <span className="ml-1">(+{delay} min)</span>}
      </div>

      {/* Banners */}
      {showBanner && isDelayed && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
          <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Flight delayed by {delay} minutes</p>
            {newDeparture && <p className="text-amber-700 text-xs mt-0.5">New departure time: {newDeparture}</p>}
          </div>
        </div>
      )}

      {showBanner && isCancelled && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
          <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800">This flight has been cancelled</p>
            <p className="text-red-700 text-xs mt-0.5">Contact the airline or FlightBook support for assistance.</p>
          </div>
        </div>
      )}

      {showBanner && isBoarding && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
          <PlaneTakeoff className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Now boarding{gate ? ` at Gate ${gate}` : ''}</p>
            <p className="text-green-700 text-xs mt-0.5">Please proceed to the gate immediately.</p>
          </div>
        </div>
      )}

      {updatedAt && (
        <p className="text-xs text-gray-400">
          Live status · Updated {format(updatedAt, 'HH:mm:ss')}
        </p>
      )}
    </div>
  );
};

export default RealTimeFlightStatus;
