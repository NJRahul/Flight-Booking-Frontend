import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { airportApi } from '../../api/axios';
import useDebounce from '../../hooks/useDebounce';

const AirportAutocomplete = ({ value, onChange, placeholder, icon: Icon, label, exclude, error }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value?.display || '');
  }, [value]);

  const debouncedQuery = useDebounce(inputValue, 300);

  const { data, isFetching } = useQuery({
    queryKey: ['airports', 'search', debouncedQuery],
    queryFn: () =>
      airportApi.get('/search', { params: { q: debouncedQuery } }).then((r) => r.data.data?.airports || []),
    enabled: debouncedQuery.length >= 2 && isOpen,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const airports = (data || []).filter((a) => a.code !== exclude?.code);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (airport) => {
    const display = `${airport.city} (${airport.code})`;
    setInputValue(display);
    onChange({ ...airport, display });
    setIsOpen(false);
    setHighlightedIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || airports.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIdx((i) => Math.min(i + 1, airports.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const target = highlightedIdx >= 0 ? airports[highlightedIdx] : airports[0];
      if (target) handleSelect(target);
    } else if (e.key === 'Escape') { setIsOpen(false); }
  };

  const showDropdown = isOpen && inputValue.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="label-text">{label}</label>}
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setHighlightedIdx(-1);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`input-field pl-10 pr-9 w-full ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-modal border border-gray-100 overflow-hidden max-h-64 overflow-y-auto">
          {isFetching && airports.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
            </div>
          ) : airports.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No airports found for "{inputValue}"</div>
          ) : (
            airports.map((airport, idx) => (
              <button
                key={airport.code}
                type="button"
                onMouseEnter={() => setHighlightedIdx(idx)}
                onClick={() => handleSelect(airport)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === highlightedIdx ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
              >
                <span className="w-10 font-bold text-primary-600 text-sm shrink-0">{airport.code}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-navy-900 truncate">{airport.name}</span>
                  <span className="block text-xs text-gray-400">{airport.city}, {airport.country}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;
