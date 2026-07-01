import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Plane, Clock, MapPin, ChevronRight, Loader2, Wifi,
  Utensils, Monitor, Zap, Luggage, Shield, Check, X, BarChart2,
} from 'lucide-react';
import { flightApi } from '../../api/axios';
import { useBookingStore } from '../../store/useBookingStore';
import useSocket from '../../hooks/useSocket';
import SeatMap from '../../components/booking/SeatMap';
import RealTimeFlightStatus from '../../components/flight/RealTimeFlightStatus';

// ─── helpers ───────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
const fmtTime = (iso) => {
  try { return format(parseISO(iso), 'HH:mm'); } catch { return iso || '--'; }
};
const fmtDate = (iso) => {
  try { return format(parseISO(iso), 'EEE, dd MMM yyyy'); } catch { return iso || '--'; }
};
const fmtDuration = (mins) => {
  if (!mins) return '--';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

// ─── Skeleton ───────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-4">
    <div className="h-5 bg-gray-200 rounded w-1/4" />
    <div className="h-36 bg-gray-200 rounded-2xl" />
    <div className="lg:flex lg:gap-8">
      <div className="flex-1 space-y-4">
        <div className="h-10 bg-gray-200 rounded-xl" />
        <div className="h-52 bg-gray-200 rounded-2xl" />
        <div className="h-72 bg-gray-200 rounded-2xl" />
      </div>
      <div className="hidden lg:block w-80 space-y-4">
        <div className="h-56 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  </div>
);

// ─── Amenity row ─────────────────────────────────────────────────────────────
const AmenityRow = ({ icon: Icon, label, available }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
    <Icon className="w-5 h-5 text-gray-500" />
    <span className="text-sm text-gray-700 flex-1">{label}</span>
    {available ? (
      <Check className="w-4 h-4 text-success-500" />
    ) : (
      <X className="w-4 h-4 text-gray-300" />
    )}
  </div>
);

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = ['Details', 'Amenities', 'Baggage', 'Cancellation Policy'];

// ─── Main component ───────────────────────────────────────────────────────────
const FlightDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const seatClassParam = searchParams.get('class') || 'economy';
  const adults = parseInt(searchParams.get('adults') || '1', 10);
  const children = parseInt(searchParams.get('children') || '0', 10);
  const infants = parseInt(searchParams.get('infants') || '0', 10);
  const tripType = searchParams.get('tripType') || 'one-way';

  const [flight, setFlight] = useState(null);
  // Live seat counts — overrides flight.seats[class].available from the API response.
  // Updated in real-time via socket so the number always matches the seat map.
  const [liveCounts, setLiveCounts] = useState(null);
  const [seatMap, setSeatMap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seatLoading, setSeatLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Details');

  const {
    seatClass,
    setSeatClass,
    setFlight: storeFlight,
    setSearchParams: storeSearchParams,
    initPassengers,
    selectedSeats,
    setSelectedSeats,
  } = useBookingStore();

  const { socket, joinFlightRoom } = useSocket();
  // Keep fetchSeats in a ref so the socket effect can call it without stale closures.
  const fetchSeatsRef = useRef(null);

  // Initialise seat class from URL param on first load
  useEffect(() => {
    setSeatClass(seatClassParam);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch flight details
  const fetchFlight = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await flightApi.get(`/${id}`, { params: { class: seatClass } });
      const data = res.data?.data || res.data;
      const flightData = data.flight || data;
      setFlight(flightData);
      setSeatMap(data.seatMap || []);
      // Seed live counts from the API response (which already uses map-derived counts).
      setLiveCounts({
        economy: flightData.seats?.economy?.available ?? 0,
        business: flightData.seats?.business?.available ?? 0,
        first: flightData.seats?.first?.available ?? 0,
      });
      storeFlight(flightData);
      storeSearchParams({ adults, children, infants, tripType });
      initPassengers(adults, children, infants);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load flight details.');
    } finally {
      setLoading(false);
    }
  }, [id, seatClass]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchFlight();
  }, [fetchFlight]);

  // Fetch seat map on class change (after initial load)
  const fetchSeats = useCallback(async (cls) => {
    try {
      setSeatLoading(true);
      const res = await flightApi.get(`/${id}/seats`, { params: { class: cls } });
      const data = res.data?.data || res.data;
      setSeatMap(data.seatMap || data || []);
      // getSeatMap now also returns availableCount — update just this class.
      if (data.availableCount !== undefined) {
        setLiveCounts((prev) => prev ? { ...prev, [cls]: data.availableCount } : prev);
      }
    } catch {
      // non-critical; keep existing seat map
    } finally {
      setSeatLoading(false);
    }
  }, [id]);

  // Keep ref in sync so the socket listener can call it without stale closures.
  useEffect(() => {
    fetchSeatsRef.current = fetchSeats;
  }, [fetchSeats]);

  // Join the flight's socket room and listen for real-time seat updates.
  useEffect(() => {
    if (!socket) return;
    joinFlightRoom(id);

    const onSeatsUpdate = ({ flightId, available }) => {
      if (String(flightId) !== String(id)) return;
      setLiveCounts(available);
      // Refresh the seat map grid for whichever class is currently displayed.
      fetchSeatsRef.current?.(seatClass);
    };

    socket.on('flight:seatsUpdate', onSeatsUpdate);
    return () => socket.off('flight:seatsUpdate', onSeatsUpdate);
  }, [socket, id, joinFlightRoom]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClassChange = (cls) => {
    setSeatClass(cls);
    setSelectedSeats([]);
    fetchSeats(cls);
  };

  const handleContinue = () => {
    if (!flight) return;
    const params = new URLSearchParams({
      class: seatClass,
      adults: String(adults),
      children: String(children),
      infants: String(infants),
      tripType,
    });
    navigate(`/booking/${flight._id || id}?${params.toString()}`);
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) return <Skeleton />;

  if (error || !flight) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="card max-w-md text-center">
          <div className="text-5xl mb-4">✈️</div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">Flight Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">{error || 'We could not load this flight.'}</p>
          <button onClick={() => navigate(-1)} className="btn-primary">
            ← Back to Search
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const currentPrice = flight.seats?.[seatClass]?.price || 0;
  // API returns flat fields: departureTime, origin (Airport), destination (Airport)
  const dep = {
    time: flight.departureTime,
    iataCode: flight.origin?.code,
    city: flight.origin?.city,
    name: flight.origin?.name,
    terminal: flight.terminal,
    gate: flight.gate,
  };
  const arr = {
    time: flight.arrivalTime,
    iataCode: flight.destination?.code,
    city: flight.destination?.city,
    name: flight.destination?.name,
  };
  const airline = flight.airline || {};
  const stops = flight.stops || 0;
  const duration = flight.duration;
  const amenities = flight.amenities || {};
  const baggage = flight.baggage || {};

  const classOptions = [
    { key: 'economy', label: 'Economy' },
    { key: 'business', label: 'Business' },
    { key: 'first', label: 'First Class' },
  ];

  const totalPax = adults + children + infants;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 pt-6">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors">Home</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <button onClick={() => navigate(-1)} className="hover:text-primary-600 transition-colors">Search Results</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-800 font-medium">Flight Details</span>
        </nav>

        {/* ── Flight Summary Card ── */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Airline */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(airline.code || 'AI').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{airline.name || 'Airline'}</p>
                <p className="text-xs text-gray-500">{airline.code || ''} · {flight.flightNumber || ''}</p>
              </div>
            </div>

            {/* Route + time */}
            <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 sm:gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{fmtTime(dep.time)}</p>
                <p className="text-sm font-semibold text-gray-700">{dep.iataCode || '---'}</p>
                <p className="text-xs text-gray-400">{fmtDate(dep.time)}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="h-px w-10 bg-gray-300" />
                  <Plane className="w-4 h-4 text-primary-500 rotate-90 sm:rotate-0" />
                  <div className="h-px w-10 bg-gray-300" />
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {fmtDuration(duration)} · {stops > 0 ? `${stops} stop${stops > 1 ? 's' : ''}` : 'Non-stop'}
                </span>
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">{fmtTime(arr.time)}</p>
                <p className="text-sm font-semibold text-gray-700">{arr.iataCode || '---'}</p>
                <p className="text-xs text-gray-400">{fmtDate(arr.time)}</p>
              </div>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-700">{fmt(currentPrice)}</p>
              <p className="text-xs text-gray-500">per person</p>
            </div>
          </div>
        </div>

        {/* ── Live flight status ── */}
        <div className="mb-6">
          <RealTimeFlightStatus
            flightId={flight._id || id}
            initialStatus={flight.status}
            initialDelay={flight.delay || 0}
            initialGate={flight.gate}
            departureTime={flight.departureTime}
          />
        </div>

        {/* ── Main 2-col layout ── */}
        <div className="lg:flex lg:gap-8 lg:items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 space-y-6">

            {/* Tabs */}
            <div className="card p-0 overflow-hidden">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
                      ${activeTab === tab
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Details tab */}
                {activeTab === 'Details' && (
                  <div className="space-y-4">
                    {/* Departure */}
                    <div className="bg-primary-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-600 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{fmtTime(dep.time)}</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {dep.city || 'City'} ({dep.iataCode || '---'})
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {dep.name || ''}
                            {dep.terminal ? ` · Terminal ${dep.terminal}` : ''}
                            {dep.gate ? ` · Gate ${dep.gate}` : ''}
                          </p>
                          <p className="text-xs text-gray-400">{fmtDate(dep.time)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Duration line */}
                    <div className="flex items-center gap-3 px-4">
                      <div className="flex-1 border-l-2 border-dashed border-gray-200 h-10 ml-1" />
                      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full">
                        <Clock className="w-3.5 h-3.5" />
                        {fmtDuration(duration)}
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="bg-success-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-success-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900">{fmtTime(arr.time)}</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {arr.city || 'City'} ({arr.iataCode || '---'})
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {arr.name || ''}
                          </p>
                          <p className="text-xs text-gray-400">{fmtDate(arr.time)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amenities tab */}
                {activeTab === 'Amenities' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AmenityRow icon={Wifi} label="Wi-Fi" available={amenities.wifi} />
                    <AmenityRow icon={Zap} label="Power Outlet / USB" available={amenities.powerOutlet || amenities.usbCharging} />
                    <AmenityRow icon={Utensils} label="Meals Included" available={amenities.meals} />
                    <AmenityRow icon={Monitor} label="In-flight Entertainment" available={amenities.entertainment} />
                    <AmenityRow icon={Luggage} label="Checked Baggage" available={!!baggage.checked} />
                  </div>
                )}

                {/* Baggage tab */}
                {activeTab === 'Baggage' && (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 font-semibold">Type</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-semibold">Allowance</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-semibold">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-4 py-3 text-gray-700 font-medium">Carry-on</td>
                          <td className="px-4 py-3 text-gray-700">{baggage.cabin || 7}kg</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">1 bag per passenger</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-700 font-medium">Checked</td>
                          <td className="px-4 py-3 text-gray-700">{baggage.checked || 15}kg</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">Additional bags at extra cost</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Cancellation Policy tab */}
                {activeTab === 'Cancellation Policy' && (
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-gray-600 font-semibold">Time Before Departure</th>
                          <th className="text-left px-4 py-3 text-gray-600 font-semibold">Refund</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-4 py-3 text-gray-700">More than 24 hours</td>
                          <td className="px-4 py-3">
                            <span className="badge-success">90% refund</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-700">12–24 hours</td>
                          <td className="px-4 py-3">
                            <span className="badge-warning">50% refund</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-700">Less than 12 hours</td>
                          <td className="px-4 py-3">
                            <span className="badge-danger">No refund</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-gray-700">Airline cancels flight</td>
                          <td className="px-4 py-3">
                            <span className="badge-success">100% refund</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ── Class Price Comparison ── */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary-500" />
                Compare Seat Classes
              </h2>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-500 font-medium w-36" />
                      {classOptions.map(({ key, label }) => {
                        const isSelected = seatClass === key;
                        return (
                          <th key={key} className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleClassChange(key)}
                              className={`w-full rounded-xl px-3 py-2 font-semibold text-sm transition-all ${
                                isSelected
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {label}
                              {isSelected && <span className="block text-xs font-normal opacity-80">Selected</span>}
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Price */}
                    <tr className="bg-primary-50/40">
                      <td className="px-3 py-3 text-gray-600 font-medium">Price / person</td>
                      {classOptions.map(({ key }) => {
                        const price = flight.seats?.[key]?.price || 0;
                        const isSelected = seatClass === key;
                        return (
                          <td key={key} className="px-3 py-3 text-center">
                            <span className={`font-bold text-base ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                              {fmt(price)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    {/* Seats left */}
                    <tr>
                      <td className="px-3 py-3 text-gray-600 font-medium">Seats left</td>
                      {classOptions.map(({ key }) => {
                        const available = liveCounts?.[key] ?? flight.seats?.[key]?.available ?? 0;
                        return (
                          <td key={key} className="px-3 py-3 text-center">
                            <span className={`text-sm font-semibold ${available < 5 ? 'text-danger-600' : available < 10 ? 'text-warning-600' : 'text-success-600'}`}>
                              {available}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                    {/* Cabin baggage */}
                    <tr>
                      <td className="px-3 py-3 text-gray-600 font-medium">Cabin baggage</td>
                      {classOptions.map(({ key }) => {
                        const allowance = key === 'economy' ? '7 kg' : key === 'business' ? '10 kg' : '15 kg';
                        return (
                          <td key={key} className="px-3 py-3 text-center text-gray-700 text-sm">{allowance}</td>
                        );
                      })}
                    </tr>
                    {/* Check-in baggage */}
                    <tr>
                      <td className="px-3 py-3 text-gray-600 font-medium">Check-in bag</td>
                      {classOptions.map(({ key }) => {
                        const allowance = key === 'economy' ? `${baggage.checked || 15} kg` : key === 'business' ? '32 kg' : '40 kg';
                        return (
                          <td key={key} className="px-3 py-3 text-center text-gray-700 text-sm">{allowance}</td>
                        );
                      })}
                    </tr>
                    {/* Meals */}
                    <tr>
                      <td className="px-3 py-3 text-gray-600 font-medium">Meals</td>
                      {classOptions.map(({ key }) => {
                        const hasMeals = key !== 'economy' ? true : !!amenities.meals;
                        return (
                          <td key={key} className="px-3 py-3 text-center">
                            {hasMeals
                              ? <Check className="w-4 h-4 text-success-500 mx-auto" />
                              : <X className="w-4 h-4 text-gray-300 mx-auto" />}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Wi-Fi */}
                    <tr>
                      <td className="px-3 py-3 text-gray-600 font-medium">Wi-Fi</td>
                      {classOptions.map(({ key }) => {
                        const hasWifi = key === 'first' ? true : (key === 'business' ? true : !!amenities.wifi);
                        return (
                          <td key={key} className="px-3 py-3 text-center">
                            {hasWifi
                              ? <Check className="w-4 h-4 text-success-500 mx-auto" />
                              : <X className="w-4 h-4 text-gray-300 mx-auto" />}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Seat width */}
                    <tr>
                      <td className="px-3 py-3 text-gray-600 font-medium">Seat type</td>
                      {classOptions.map(({ key }) => {
                        const type = key === 'economy' ? 'Standard' : key === 'business' ? 'Lie-flat' : 'Private Suite';
                        return (
                          <td key={key} className="px-3 py-3 text-center text-gray-700 text-sm">{type}</td>
                        );
                      })}
                    </tr>
                    {/* Select row */}
                    <tr>
                      <td className="px-3 py-3" />
                      {classOptions.map(({ key, label }) => {
                        const isSelected = seatClass === key;
                        const available = liveCounts?.[key] ?? flight.seats?.[key]?.available ?? 0;
                        return (
                          <td key={key} className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleClassChange(key)}
                              disabled={available === 0}
                              className={`text-xs px-4 py-1.5 rounded-lg font-semibold transition-all ${
                                available === 0
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-primary-600 text-white'
                                    : 'border border-primary-500 text-primary-600 hover:bg-primary-50'
                              }`}
                            >
                              {available === 0 ? 'Sold Out' : isSelected ? 'Selected' : 'Select'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Seat Map ── */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-500" />
                Select Your Seats (Optional)
              </h2>
              {seatLoading ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading seat map…
                </div>
              ) : (
                <SeatMap
                  seatClass={seatClass}
                  seats={seatMap}
                  selectedSeats={selectedSeats}
                  onSeatToggle={setSelectedSeats}
                  maxSelectable={totalPax}
                />
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-4 space-y-4">

            {/* Class selector */}
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Select Class</h3>
              {classOptions.map(({ key, label }) => {
                const info = flight.seats?.[key] || {};
                const price = info.price || 0;
                const available = liveCounts?.[key] ?? info.available ?? 0;
                const isSelected = seatClass === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleClassChange(key)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-150
                      ${isSelected
                        ? 'border-2 border-primary-500 bg-primary-50'
                        : 'border border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}>
                        {label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-primary-600" />}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{fmt(price)}</span>
                      <span className={`text-xs ${available < 5 ? 'text-danger-500 font-semibold' : 'text-gray-400'}`}>
                        {available} seats left
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fare rules */}
            <div className="card space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Fare Rules</h3>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                <span>Free cancellation (more than 24h before)</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-success-500 mt-0.5 shrink-0" />
                <span>E-ticket sent instantly</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <X className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                <span>Date changes not allowed</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" />
                <span>Secure payment via PCI-DSS</span>
              </div>
            </div>

            {/* Price + CTA */}
            <div className="card border-primary-200 border-2">
              <div className="mb-3">
                <p className="text-3xl font-bold text-primary-700">{fmt(currentPrice)}</p>
                <p className="text-xs text-gray-500">per person · all taxes included</p>
              </div>
              {totalPax > 1 && (
                <p className="text-sm text-gray-700 mb-3">
                  Total for {totalPax} passengers:{' '}
                  <span className="font-semibold text-gray-900">
                    {fmt(currentPrice * (adults + children * 0.75 + infants * 0.1))}
                  </span>
                </p>
              )}
              <button
                onClick={handleContinue}
                className="btn-primary w-full"
              >
                Continue to Book →
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">No hidden fees</p>
            </div>
          </div>
        </div>

        {/* ── Mobile sticky CTA ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-primary-700">{fmt(currentPrice)}</p>
            <p className="text-xs text-gray-500">per person</p>
          </div>
          <button onClick={handleContinue} className="btn-primary">
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightDetailPage;
