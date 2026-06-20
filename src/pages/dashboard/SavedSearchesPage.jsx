import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plane, Trash2, ArrowRight, Users, Calendar } from 'lucide-react';
import { savedSearchApi } from '../../api/axios';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const classLabels = { economy: 'Economy', business: 'Business', first: 'First Class' };

const buildSearchUrl = (s) => {
  const params = new URLSearchParams({
    from: s.from || '',
    to: s.to || '',
    fromCity: s.fromCity || s.from || '',
    toCity: s.toCity || s.to || '',
    departureDate: s.departureDate || '',
    adults: String(s.adults || 1),
    children: String(s.children || 0),
    infants: String(s.infants || 0),
    class: s.class || 'economy',
    tripType: s.tripType || 'one-way',
  });
  if (s.returnDate) params.set('returnDate', s.returnDate);
  return `/search?${params.toString()}`;
};

const formatSearchDate = (d) => {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
};

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  const fetchSearches = useCallback(() => {
    savedSearchApi.get('/').then(r => {
      setSearches(r.data.data?.savedSearches || []);
    }).catch(() => toast.error('Failed to load saved searches')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSearches(); }, [fetchSearches]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await savedSearchApi.delete(`/${id}`);
      setSearches(prev => prev.filter(s => s._id !== id));
      toast.success('Saved search removed');
    } catch {
      toast.error('Failed to delete saved search');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 w-full">
        <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 h-28 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Saved Searches</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {searches.length === 0
            ? 'No saved searches yet'
            : `${searches.length} saved search${searches.length !== 1 ? 'es' : ''}`}
        </p>
      </div>

      {searches.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-red-300" />
          </div>
          <h3 className="text-base font-semibold text-navy-900 mb-1">No saved searches</h3>
          <p className="text-sm text-gray-400 mb-5 max-w-xs">
            Search for flights and click the heart icon to save a search for quick access later.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="btn-primary text-sm px-5 py-2"
          >
            Search Flights
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <div key={s._id} className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Plane className="w-5 h-5 text-primary-600" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-navy-900">
                    {s.fromCity || s.from}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-base font-semibold text-navy-900">
                    {s.toCity || s.to}
                  </span>
                  {s.tripType === 'round-trip' && (
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                      Round-trip
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {s.departureDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatSearchDate(s.departureDate)}
                      {s.returnDate && ` → ${formatSearchDate(s.returnDate)}`}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {s.adults + (s.children || 0) + (s.infants || 0)} passenger{(s.adults + (s.children || 0) + (s.infants || 0)) !== 1 ? 's' : ''}
                  </span>
                  <span className="capitalize font-medium text-gray-600">
                    {classLabels[s.class] || s.class}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(buildSearchUrl(s))}
                  className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5"
                >
                  Search Again <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(s._id)}
                  disabled={deleting === s._id}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        You can save up to 20 searches. Saved searches do not reserve seats.
      </p>
    </div>
  );
}
