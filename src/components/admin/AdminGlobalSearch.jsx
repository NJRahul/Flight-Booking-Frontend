import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plane, ClipboardList, Users, X, ArrowRight } from 'lucide-react';
import { adminApi } from '../../api/axios';

export default function AdminGlobalSearch({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ flights: [], bookings: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ flights: [], bookings: [], users: [] });
      setSelectedIdx(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ flights: [], bookings: [], users: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await adminApi.get('/search', { params: { q: query } });
        setResults(r.data.data || { flights: [], bookings: [], users: [] });
        setSelectedIdx(0);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const allResults = [
    ...results.flights.map(f => ({ type: 'flight', data: f })),
    ...results.bookings.map(b => ({ type: 'booking', data: b })),
    ...results.users.map(u => ({ type: 'user', data: u })),
  ];

  const navigateTo = ({ type }) => {
    if (type === 'flight') navigate('/admin/flights');
    if (type === 'booking') navigate('/admin/bookings');
    if (type === 'user') navigate('/admin/users');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, allResults.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && allResults[selectedIdx]) {
      navigateTo(allResults[selectedIdx]);
    }
  };

  if (!open) return null;

  const flightOffset = 0;
  const bookingOffset = results.flights.length;
  const userOffset = results.flights.length + results.bookings.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative min-h-screen flex items-start justify-center pt-20 px-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search flights, bookings, users..."
              className="flex-1 text-base outline-none placeholder:text-gray-400"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {query.length < 2 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Type at least 2 characters to search
              </div>
            ) : results.flights.length === 0 && results.bookings.length === 0 && results.users.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No results found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {results.flights.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                      Flights
                    </div>
                    {results.flights.map((f, i) => (
                      <button
                        key={f._id}
                        onClick={() => navigateTo({ type: 'flight', data: f })}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedIdx === flightOffset + i ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <Plane className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {f.flightNumber} — {f.airline?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {f.origin?.code} → {f.destination?.code} · {f.status}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {results.bookings.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                      Bookings
                    </div>
                    {results.bookings.map((b, i) => (
                      <button
                        key={b._id}
                        onClick={() => navigateTo({ type: 'booking', data: b })}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedIdx === bookingOffset + i ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold font-mono text-gray-900">
                            {b.bookingReference}
                          </p>
                          <p className="text-xs text-gray-500">
                            {b.user?.name} · {b.status} · ₹{b.pricing?.totalAmount?.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {results.users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                      Users
                    </div>
                    {results.users.map((u, i) => (
                      <button
                        key={u._id}
                        onClick={() => navigateTo({ type: 'user', data: u })}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          selectedIdx === userOffset + i ? 'bg-primary-50' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email} · {u.role}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 ml-auto shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>Esc close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
