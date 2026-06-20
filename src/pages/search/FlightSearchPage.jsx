import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown, ChevronUp, SlidersHorizontal, X, Plane, Clock, Wifi,
  Utensils, Monitor, Zap, Luggage, RefreshCw, Info, ArrowRight, Filter
} from 'lucide-react';
import { flightApi } from '../../api/axios';
import { QUERY_KEYS } from '../../utils/constants';
import { formatCurrency, formatDate, formatDuration, formatTime } from '../../utils/formatters';
import SeatClassBadge from '../../components/search/SeatClassBadge';
import FlightSearchWidget from '../../components/search/FlightSearchWidget';

// ── Constants ─────────────────────────────────────────────────────────────────

const AIRLINE_COLORS = {
  'AI': '#E01D24', '6E': '#4F46E5', 'SG': '#EF4444', 'UK': '#7C3AED',
  'G8': '#F59E0B', 'EK': '#C5A028', 'SQ': '#1E40AF', 'QR': '#7C0A02',
  'BA': '#003399', 'LH': '#0A3A6A',
};

const getAirlineColor = (code) => AIRLINE_COLORS[code] || '#6B7280';

const TIME_BANDS = [
  { id: 'morning', label: '🌅 Morning', sub: '6AM – 12PM', test: (h) => h >= 6 && h < 12 },
  { id: 'afternoon', label: '☀️ Afternoon', sub: '12PM – 6PM', test: (h) => h >= 12 && h < 18 },
  { id: 'evening', label: '🌙 Evening', sub: '6PM – 12AM', test: (h) => h >= 18 },
  { id: 'night', label: '🌃 Night', sub: '12AM – 6AM', test: (h) => h < 6 },
];

const RESULTS_PER_PAGE = 10;

// ── Skeleton ──────────────────────────────────────────────────────────────────

const FlightCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-3 animate-pulse">
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="space-y-1.5">
          <div className="h-3.5 bg-gray-200 rounded w-24" />
          <div className="h-2.5 bg-gray-200 rounded w-16" />
        </div>
      </div>
      <div className="flex-1 flex items-center gap-4 mx-8">
        <div className="h-8 bg-gray-200 rounded w-16" />
        <div className="flex-1 h-0.5 bg-gray-200 rounded" />
        <div className="h-8 bg-gray-200 rounded w-16" />
      </div>
      <div className="text-right space-y-1.5">
        <div className="h-6 bg-gray-200 rounded w-20" />
        <div className="h-9 bg-gray-200 rounded-lg w-24" />
      </div>
    </div>
  </div>
);

// ── Stop Line ─────────────────────────────────────────────────────────────────

const StopLine = ({ stops }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="flex items-center gap-0.5">
      <div className="h-0.5 w-8 bg-gray-300 rounded" />
      {stops > 0 && <div className="w-2 h-2 rounded-full bg-warning-500 border-2 border-white shadow-sm" />}
      {stops > 1 && <div className="w-2 h-2 rounded-full bg-warning-500 border-2 border-white shadow-sm" />}
      <div className="h-0.5 w-8 bg-gray-300 rounded" />
    </div>
    <span className={`text-xs font-medium ${stops === 0 ? 'text-success-700' : 'text-warning-700'}`}>
      {stops === 0 ? 'Non-stop' : stops === 1 ? '1 Stop' : `${stops} Stops`}
    </span>
  </div>
);

// ── Best Pick Card ────────────────────────────────────────────────────────────

const BestPickCard = ({ label, flight, seatClass, isActive, onClick }) => {
  if (!flight) return null;
  const price = flight.totalPrice || flight.seats?.[seatClass]?.price || 0;
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[160px] text-left p-3 rounded-xl border transition-all duration-150 ${isActive ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-primary-200'}`}
    >
      <p className="text-xs font-semibold text-primary-600 mb-1">{label}</p>
      <p className="text-lg font-bold text-navy-900">{formatCurrency(price)}</p>
      <p className="text-xs text-gray-500">{formatDuration(flight.duration)}</p>
    </button>
  );
};

// ── Flight Result Card ────────────────────────────────────────────────────────

const TABS = ['Fare Details', 'Baggage', 'Amenities', 'Cancellation'];

const FlightResultCard = ({ flight, seatClass, passengers, isExpanded, onToggle, urlParams }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Fare Details');
  const price = flight.totalPrice || flight.seats?.[seatClass]?.price || 0;
  const basePrice = flight.seats?.[seatClass]?.price || price / (passengers.adults + passengers.children * 0.75 + passengers.infants * 0.1);
  const taxes = Math.round(price * 0.18);
  const airlineCode = flight.airline?.code || '';
  const color = getAirlineColor(airlineCode);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Fare Details':
        return (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Base fare (per person)</span><span className="font-medium text-navy-900">{formatCurrency(basePrice)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Taxes & fees (18%)</span><span className="font-medium text-navy-900">{formatCurrency(taxes)}</span></div>
            <div className="h-px bg-gray-100 my-1" />
            <div className="flex justify-between font-semibold text-navy-900"><span>Total ({passengers.adults + passengers.children} pax)</span><span className="text-primary-700">{formatCurrency(price)}</span></div>
          </div>
        );
      case 'Baggage':
        return (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3"><Luggage className="w-4 h-4 text-primary-600" /><span className="text-gray-700">Cabin baggage: <strong>{flight.baggage?.cabin || 7} kg</strong></span></div>
            <div className="flex items-center gap-3"><Luggage className="w-4 h-4 text-gray-500" /><span className="text-gray-700">Checked baggage: <strong>{flight.baggage?.checked || 20} kg</strong></span></div>
          </div>
        );
      case 'Amenities':
        return (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { key: 'wifi', icon: Wifi, label: 'Wi-Fi' },
              { key: 'meals', icon: Utensils, label: 'Meals' },
              { key: 'entertainment', icon: Monitor, label: 'Entertainment' },
              { key: 'usb', icon: Zap, label: 'USB Charging' },
            ].map(({ key, icon: Icon, label }) => {
              const available = flight.amenities?.[key];
              return (
                <div key={key} className={`flex items-center gap-2 ${available ? 'text-gray-700' : 'text-gray-300'}`}>
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {!available && <span className="text-xs text-gray-300">(N/A)</span>}
                </div>
              );
            })}
          </div>
        );
      case 'Cancellation':
        return (
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ Cancellation up to 24h before departure: <strong>10% charge</strong></p>
            <p>⚠️ Cancellation within 24h: <strong>25% charge</strong></p>
            <p>❌ No-show: <strong>Non-refundable</strong></p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-2xl border mb-3 transition-all duration-200 ${isExpanded ? 'border-primary-200 shadow-card-hover' : 'border-gray-100 shadow-card hover:shadow-card-hover hover:border-primary-100'}`}>
      {/* Main row */}
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Airline */}
          <div className="flex items-center gap-3 md:w-44 shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: color }}>
              {airlineCode || '??'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-900 truncate">{flight.airline?.name || 'Unknown Airline'}</p>
              <p className="text-xs text-gray-400">{flight.flightNumber}</p>
            </div>
          </div>

          {/* Times + stops */}
          <div className="flex-1 flex items-center gap-3 md:gap-5">
            <div className="text-center">
              <p className="text-xl font-bold text-navy-900">{formatTime(flight.departureTime)}</p>
              <p className="text-xs text-gray-400 font-medium">{flight.origin?.code || '—'}</p>
              <p className="text-xs text-gray-300 hidden md:block">{flight.origin?.city}</p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
              <p className="text-xs text-gray-400 font-medium">{formatDuration(flight.duration)}</p>
              <StopLine stops={flight.stops || 0} />
            </div>

            <div className="text-center">
              <p className="text-xl font-bold text-navy-900">{formatTime(flight.arrivalTime)}</p>
              <p className="text-xs text-gray-400 font-medium">{flight.destination?.code || '—'}</p>
              <p className="text-xs text-gray-300 hidden md:block">{flight.destination?.city}</p>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-3 md:w-36 shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-700">{formatCurrency(price)}</p>
              <p className="text-xs text-gray-400">per person</p>
              <SeatClassBadge seatClass={seatClass} className="mt-1" />
            </div>
            <button
              onClick={() => navigate(`/flights/${flight._id}?${urlParams}`)}
              className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              Select <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expand toggle */}
        <div className="flex justify-center mt-3">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide details</> : <><ChevronDown className="w-3.5 h-3.5" /> Show details</>}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-5">
          <div className="flex gap-1 mb-4 bg-gray-50 rounded-xl p-1 w-fit">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>
          {renderTabContent()}
        </div>
      )}
    </div>
  );
};

// ── Filter Panel ──────────────────────────────────────────────────────────────

const FilterPanel = ({ filters, onChange, stats, onReset }) => {
  const { priceRange, stops, airlines: selectedAirlines, departureBands, maxDurationHours } = filters;
  const [minP, maxP] = priceRange;

  const toggleAirline = (code) => {
    const next = selectedAirlines.includes(code) ? selectedAirlines.filter((c) => c !== code) : [...selectedAirlines, code];
    onChange({ ...filters, airlines: next });
  };

  const toggleBand = (id) => {
    const next = departureBands.includes(id) ? departureBands.filter((b) => b !== id) : [...departureBands, id];
    onChange({ ...filters, departureBands: next });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy-900 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
        <button onClick={onReset} className="text-xs text-danger-500 hover:text-danger-600 font-medium">Reset All</button>
      </div>

      {/* Price range */}
      <div>
        <h4 className="text-sm font-semibold text-navy-900 mb-3">Price Range</h4>
        <div className="space-y-2">
          <input
            type="range"
            min={stats.minPrice}
            max={stats.maxPrice}
            value={maxP}
            onChange={(e) => onChange({ ...filters, priceRange: [minP, parseInt(e.target.value)] })}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatCurrency(minP)}</span>
            <span className="font-semibold text-primary-700">{formatCurrency(maxP)}</span>
          </div>
        </div>
      </div>

      {/* Stops */}
      <div>
        <h4 className="text-sm font-semibold text-navy-900 mb-3">Stops</h4>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'any', label: 'Any' },
            { id: '0', label: `Non-stop (${stats.stopCounts?.[0] || 0})` },
            { id: '1', label: `1 Stop (${stats.stopCounts?.[1] || 0})` },
            { id: '2+', label: '2+ Stops' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => onChange({ ...filters, stops: id })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${stops === id ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-200 text-gray-600 hover:border-primary-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Airlines */}
      {stats.airlines?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-navy-900 mb-3">Airlines</h4>
          <div className="space-y-2">
            {stats.airlines.map((airline) => (
              <label key={airline.code} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedAirlines.includes(airline.code)}
                  onChange={() => toggleAirline(airline.code)}
                  className="w-4 h-4 rounded accent-primary-600"
                />
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getAirlineColor(airline.code) }} />
                <span className="text-sm text-gray-700 group-hover:text-navy-900 transition-colors">{airline.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Departure time */}
      <div>
        <h4 className="text-sm font-semibold text-navy-900 mb-3">Departure Time</h4>
        <div className="grid grid-cols-2 gap-2">
          {TIME_BANDS.map((band) => (
            <button key={band.id} onClick={() => toggleBand(band.id)}
              className={`p-2 rounded-xl border text-xs text-center transition-all ${departureBands.includes(band.id) ? 'bg-primary-50 border-primary-400 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              <span className="block font-medium">{band.label}</span>
              <span className="text-gray-400">{band.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <h4 className="text-sm font-semibold text-navy-900 mb-3">Max Duration</h4>
        <input
          type="range"
          min={1}
          max={stats.maxDurationHours || 24}
          value={maxDurationHours || stats.maxDurationHours || 24}
          onChange={(e) => onChange({ ...filters, maxDurationHours: parseInt(e.target.value) })}
          className="w-full accent-primary-600"
        />
        <p className="text-xs text-gray-500 mt-1">Up to <span className="font-semibold text-primary-700">{maxDurationHours || stats.maxDurationHours || 24}h</span></p>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const FlightSearchPage = () => {
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const [showFullSearch, setShowFullSearch] = useState(false);
  const [sortBy, setSortBy] = useState('price_asc');
  const [page, setPage] = useState(1);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const searchConfig = useMemo(() => ({
    from: urlParams.get('from'),
    fromCity: urlParams.get('fromCity'),
    to: urlParams.get('to'),
    toCity: urlParams.get('toCity'),
    departureDate: urlParams.get('departureDate'),
    returnDate: urlParams.get('returnDate'),
    adults: parseInt(urlParams.get('adults')) || 1,
    children: parseInt(urlParams.get('children')) || 0,
    infants: parseInt(urlParams.get('infants')) || 0,
    class: urlParams.get('class') || 'economy',
    tripType: urlParams.get('tripType') || 'one-way',
  }), [urlParams]);

  const { from, to, fromCity, toCity, departureDate, adults, children, infants } = searchConfig;
  const seatClass = searchConfig.class;
  const totalPassengers = adults + children + infants;
  const compactLabel = [
    from && to ? `${fromCity || from} → ${toCity || to}` : '',
    departureDate ? formatDate(departureDate, 'd MMM') : '',
    `${totalPassengers} Adult${totalPassengers !== 1 ? 's' : ''}`,
    seatClass.charAt(0).toUpperCase() + seatClass.slice(1),
  ].filter(Boolean).join(' · ');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [QUERY_KEYS.FLIGHTS, 'search', searchConfig],
    queryFn: () =>
      flightApi.get('/search', {
        params: { from, to, departureDate, returnDate: searchConfig.returnDate, adults, children, infants, class: seatClass, tripType: searchConfig.tripType },
      }).then((r) => r.data.data),
    enabled: !!(from && to && departureDate),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const allFlights = data?.outbound || [];

  // Compute stats from all flights
  const stats = useMemo(() => {
    if (allFlights.length === 0) return { minPrice: 0, maxPrice: 50000, airlines: [], stopCounts: {}, maxDurationHours: 24 };
    const prices = allFlights.map((f) => f.totalPrice || f.seats?.[seatClass]?.price || 0).filter(Boolean);
    const airlinesMap = new Map();
    const stopCounts = {};
    let maxMin = 0;
    allFlights.forEach((f) => {
      if (f.airline?.code) airlinesMap.set(f.airline.code, f.airline);
      const s = f.stops || 0;
      stopCounts[s] = (stopCounts[s] || 0) + 1;
      if ((f.duration || 0) > maxMin) maxMin = f.duration;
    });
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      airlines: [...airlinesMap.values()],
      stopCounts,
      maxDurationHours: Math.ceil(maxMin / 60),
    };
  }, [allFlights, seatClass]);

  const [filters, setFilters] = useState({
    priceRange: [0, 200000],
    stops: 'any',
    airlines: [],
    departureBands: [],
    maxDurationHours: null,
  });

  // Re-initialize price range when results arrive
  useEffect(() => {
    if (stats.maxPrice > 0) {
      setFilters((f) => ({ ...f, priceRange: [stats.minPrice, stats.maxPrice] }));
    }
  }, [stats.minPrice, stats.maxPrice]);

  const resetFilters = () => setFilters({ priceRange: [stats.minPrice, stats.maxPrice], stops: 'any', airlines: [], departureBands: [], maxDurationHours: null });

  const filteredFlights = useMemo(() => {
    let result = [...allFlights];
    const [minP, maxP] = filters.priceRange;

    result = result.filter((f) => {
      const price = f.totalPrice || f.seats?.[seatClass]?.price || 0;
      return price >= minP && price <= maxP;
    });

    if (filters.stops !== 'any') {
      result = result.filter((f) => {
        const s = f.stops || 0;
        if (filters.stops === '2+') return s >= 2;
        return s === parseInt(filters.stops);
      });
    }

    if (filters.airlines.length > 0) {
      result = result.filter((f) => filters.airlines.includes(f.airline?.code || ''));
    }

    if (filters.departureBands.length > 0) {
      result = result.filter((f) => {
        const h = new Date(f.departureTime).getHours();
        return filters.departureBands.some((id) => TIME_BANDS.find((b) => b.id === id)?.test(h));
      });
    }

    if (filters.maxDurationHours) {
      result = result.filter((f) => (f.duration || 0) <= filters.maxDurationHours * 60);
    }

    result.sort((a, b) => {
      const aP = a.totalPrice || 0, bP = b.totalPrice || 0;
      const aD = a.duration || 0, bD = b.duration || 0;
      switch (sortBy) {
        case 'price_asc': return aP - bP;
        case 'price_desc': return bP - aP;
        case 'duration_asc': return aD - bD;
        case 'departure_asc': return new Date(a.departureTime) - new Date(b.departureTime);
        case 'arrival_asc': return new Date(a.arrivalTime) - new Date(b.arrivalTime);
        default: return aP - bP;
      }
    });

    return result;
  }, [allFlights, filters, sortBy, seatClass]);

  const bestPicks = useMemo(() => {
    if (allFlights.length === 0) return null;
    const byPrice = [...allFlights].sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));
    const byDuration = [...allFlights].sort((a, b) => (a.duration || 0) - (b.duration || 0));
    const byValue = [...allFlights].sort((a, b) => {
      const ar = (a.totalPrice || 99999) / (a.duration || 1);
      const br = (b.totalPrice || 99999) / (b.duration || 1);
      return ar - br;
    });
    return { cheapest: byPrice[0], fastest: byDuration[0], bestValue: byValue[0] };
  }, [allFlights]);

  const totalPages = Math.ceil(filteredFlights.length / RESULTS_PER_PAGE);
  const paginatedFlights = filteredFlights.slice((page - 1) * RESULTS_PER_PAGE, page * RESULTS_PER_PAGE);

  const toggleCard = (id) => setExpandedCard((prev) => (prev === id ? null : id));

  const passengers = { adults, children, infants: searchConfig.infants };

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
        <Plane className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold font-display text-navy-900 mb-2">No flights found</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">Try adjusting your filters or search for different dates to find available flights.</p>
      <div className="flex gap-3">
        <button onClick={resetFilters} className="btn-secondary text-sm px-4 py-2">Clear Filters</button>
        <button onClick={() => setShowFullSearch(true)} className="btn-primary text-sm px-4 py-2">Modify Search</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        {showFullSearch ? (
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-navy-900">Modify Search</p>
              <button onClick={() => setShowFullSearch(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <FlightSearchWidget initialValues={searchConfig} />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Plane className="w-4 h-4 text-primary-600 shrink-0" />
              <span className="text-sm font-medium text-navy-900 truncate">{compactLabel}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowMobileFilters(true)} className="lg:hidden btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              <button onClick={() => setShowFullSearch(true)} className="btn-secondary text-sm px-4 py-2">Modify Search</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20">
              <FilterPanel filters={filters} onChange={setFilters} stats={stats} onReset={resetFilters} />
            </div>
          </aside>

          {/* Results */}
          <main className="flex-1 min-w-0">
            {/* Best picks */}
            {!isLoading && bestPicks && allFlights.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Best Picks</p>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  <BestPickCard label="🏷️ Cheapest" flight={bestPicks.cheapest} seatClass={seatClass} onClick={() => navigate(`/flights/${bestPicks.cheapest._id}?${urlParams}`)} />
                  <BestPickCard label="⚡ Fastest" flight={bestPicks.fastest} seatClass={seatClass} onClick={() => navigate(`/flights/${bestPicks.fastest._id}?${urlParams}`)} />
                  <BestPickCard label="⭐ Best Value" flight={bestPicks.bestValue} seatClass={seatClass} onClick={() => navigate(`/flights/${bestPicks.bestValue._id}?${urlParams}`)} />
                </div>
              </div>
            )}

            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm text-gray-500">
                {isLoading ? 'Searching…' : `Showing ${filteredFlights.length} of ${allFlights.length} flights`}
              </p>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="select-field w-auto text-sm py-2">
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="duration_asc">Shortest Duration</option>
                <option value="departure_asc">Earliest Departure</option>
                <option value="arrival_asc">Latest Arrival</option>
              </select>
            </div>

            {/* Cards */}
            {isLoading ? (
              Array(5).fill(0).map((_, i) => <FlightCardSkeleton key={i} />)
            ) : isError ? (
              <div className="card text-center py-12">
                <Info className="w-10 h-10 text-danger-400 mx-auto mb-3" />
                <p className="text-navy-900 font-semibold mb-1">Search failed</p>
                <p className="text-gray-500 text-sm mb-4">Unable to load flight results. Please try again.</p>
                <button onClick={refetch} className="btn-primary px-5 py-2 flex items-center gap-2 mx-auto">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            ) : filteredFlights.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {paginatedFlights.map((flight) => (
                  <FlightResultCard
                    key={flight._id}
                    flight={flight}
                    seatClass={seatClass}
                    passengers={passengers}
                    isExpanded={expandedCard === flight._id}
                    onToggle={() => toggleCard(flight._id)}
                    urlParams={urlParams.toString()}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-primary-300 transition-colors">←</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-primary-600 text-white' : 'border border-gray-200 hover:border-primary-300'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-primary-300 transition-colors">→</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-navy-900">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel filters={filters} onChange={setFilters} stats={stats} onReset={resetFilters} />
            </div>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setShowMobileFilters(false)} className="btn-primary w-full">Show {filteredFlights.length} Flights</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightSearchPage;
