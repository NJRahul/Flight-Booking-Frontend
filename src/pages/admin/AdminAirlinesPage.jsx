import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Power, Search, X, ChevronLeft, ChevronRight, Plane } from 'lucide-react';
import { adminApi } from '../../api/axios';
import toast from 'react-hot-toast';

const defaultForm = {
  code: '',
  name: '',
  country: '',
  logo: '',
  isActive: true,
  baggage: { cabin: 7, checked: 20 },
  fleetSize: '',
  rating: '',
};

function SkeletonRows({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded-lg" />
        </td>
      ))}
    </tr>
  ));
}

export default function AdminAirlinesPage() {
  const [airlines, setAirlines] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [modal, setModal] = useState(null); // null | 'create' | airline object
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null); // airline _id being toggled

  const fetchAirlines = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const r = await adminApi.get('/airlines', { params });
      setAirlines(r.data.data?.airlines || []);
      setTotal(r.data.data?.total || 0);
    } catch {
      toast.error('Failed to load airlines');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchAirlines(); }, [fetchAirlines]);

  // Populate form when editing
  useEffect(() => {
    if (modal && modal !== 'create') {
      setForm({
        code: modal.code || '',
        name: modal.name || '',
        country: modal.country || '',
        logo: modal.logo || '',
        isActive: modal.isActive ?? true,
        baggage: {
          cabin: modal.baggage?.cabin ?? 7,
          checked: modal.baggage?.checked ?? 20,
        },
        fleetSize: modal.fleetSize ?? '',
        rating: modal.rating ?? '',
      });
    } else if (modal === 'create') {
      setForm(defaultForm);
    }
  }, [modal]);

  const handleSave = async () => {
    if (!form.code || !form.name) {
      toast.error('Code and name are required');
      return;
    }
    setSaving(true);
    try {
      if (modal === 'create') {
        await adminApi.post('/airlines', form);
        toast.success('Airline created');
      } else {
        await adminApi.put(`/airlines/${modal._id}`, form);
        toast.success('Airline updated');
      }
      setModal(null);
      fetchAirlines();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (airline) => {
    setToggling(airline._id);
    try {
      await adminApi.put(`/airlines/${airline._id}`, { isActive: !airline.isActive });
      toast.success(`Airline ${!airline.isActive ? 'activated' : 'deactivated'}`);
      fetchAirlines();
    } catch {
      toast.error('Failed to update airline');
    } finally {
      setToggling(null);
    }
  };

  const setFormField = (path, value) => {
    setForm(prev => {
      const keys = path.split('.');
      if (keys.length === 1) return { ...prev, [keys[0]]: value };
      if (keys.length === 2) return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value } };
      return prev;
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Airline Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} airlines total</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Airline
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search airlines..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1); }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Country</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Fleet Size</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Rating</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRows count={8} />
              ) : airlines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Plane className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No airlines found</p>
                  </td>
                </tr>
              ) : (
                airlines.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold font-mono">
                        {a.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {a.logo ? (
                          <img src={a.logo} alt={a.name} className="w-7 h-7 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Plane className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.country || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.fleetSize != null ? a.fleetSize : '—'}</td>
                    <td className="px-4 py-3">
                      {a.rating != null ? (
                        <span className="flex items-center gap-1 text-sm">
                          <span className="text-amber-400">★</span>
                          <span className="font-medium text-gray-700">{Number(a.rating).toFixed(1)}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        a.isActive
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal(a)}
                          title="Edit"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(a)}
                          disabled={toggling === a._id}
                          title={a.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            a.isActive
                              ? 'hover:bg-red-50 text-red-500'
                              : 'hover:bg-green-50 text-green-600'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-1">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {modal === 'create' ? 'Add Airline' : `Edit Airline — ${modal.code}`}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">IATA Code *</label>
                  <input
                    type="text"
                    className="input-field uppercase"
                    value={form.code}
                    onChange={e => setFormField('code', e.target.value.toUpperCase())}
                    placeholder="e.g. AI"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="label-text">Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.name}
                    onChange={e => setFormField('name', e.target.value)}
                    placeholder="e.g. Air India"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Country</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.country}
                  onChange={e => setFormField('country', e.target.value)}
                  placeholder="e.g. India"
                />
              </div>

              <div>
                <label className="label-text">Logo URL</label>
                <input
                  type="url"
                  className="input-field"
                  value={form.logo}
                  onChange={e => setFormField('logo', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Fleet Size</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.fleetSize}
                    onChange={e => setFormField('fleetSize', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 120"
                    min="0"
                  />
                </div>
                <div>
                  <label className="label-text">Rating (0–5)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.rating}
                    onChange={e => setFormField('rating', e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 4.2"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Baggage Allowance (kg)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Cabin</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.baggage.cabin}
                      onChange={e => setFormField('baggage.cabin', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="label-text">Checked</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.baggage.checked}
                      onChange={e => setFormField('baggage.checked', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setFormField('isActive', e.target.checked)}
                  className="rounded"
                />
                Active
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Saving...' : modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
