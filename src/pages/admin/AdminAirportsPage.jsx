import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Power, Search, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { adminApi } from '../../api/axios';
import toast from 'react-hot-toast';

const defaultForm = {
  code: '',
  name: '',
  city: '',
  country: '',
  countryCode: '',
  timezone: '',
  terminals: '',
  isActive: true,
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

export default function AdminAirportsPage() {
  const [airports, setAirports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [modal, setModal] = useState(null); // null | 'create' | airport object
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null); // airport _id being toggled

  const fetchAirports = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      const r = await adminApi.get('/airports', { params });
      setAirports(r.data.data?.airports || []);
      setTotal(r.data.data?.total || 0);
    } catch {
      toast.error('Failed to load airports');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchAirports(); }, [fetchAirports]);

  // Populate form when editing
  useEffect(() => {
    if (modal && modal !== 'create') {
      setForm({
        code: modal.code || '',
        name: modal.name || '',
        city: modal.city || '',
        country: modal.country || '',
        countryCode: modal.countryCode || '',
        timezone: modal.timezone || '',
        terminals: modal.terminals ?? '',
        isActive: modal.isActive ?? true,
      });
    } else if (modal === 'create') {
      setForm(defaultForm);
    }
  }, [modal]);

  const handleSave = async () => {
    if (!form.code || !form.name || !form.city) {
      toast.error('Code, name and city are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, terminals: form.terminals === '' ? undefined : Number(form.terminals) };
      if (modal === 'create') {
        await adminApi.post('/airports', payload);
        toast.success('Airport created');
      } else {
        await adminApi.put(`/airports/${modal._id}`, payload);
        toast.success('Airport updated');
      }
      setModal(null);
      fetchAirports();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (airport) => {
    setToggling(airport._id);
    try {
      await adminApi.put(`/airports/${airport._id}`, { isActive: !airport.isActive });
      toast.success(`Airport ${!airport.isActive ? 'activated' : 'deactivated'}`);
      fetchAirports();
    } catch {
      toast.error('Failed to update airport');
    } finally {
      setToggling(null);
    }
  };

  const setFormField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Airport Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} airports total</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Airport
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Search airports..."
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">IATA Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">City</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Country</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Terminals</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRows count={8} />
              ) : airports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No airports found</p>
                  </td>
                </tr>
              ) : (
                airports.map(a => (
                  <tr key={a._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-bold font-mono">
                        {a.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{a.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.city || '—'}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-700">{a.country || '—'}</p>
                        {a.countryCode && (
                          <p className="text-xs text-gray-400 font-mono">{a.countryCode}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {a.terminals != null ? a.terminals : '—'}
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
                {modal === 'create' ? 'Add Airport' : `Edit Airport — ${modal.code}`}
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
                    placeholder="e.g. DEL"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="label-text">Terminals</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.terminals}
                    onChange={e => setFormField('terminals', e.target.value)}
                    placeholder="e.g. 3"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.name}
                  onChange={e => setFormField('name', e.target.value)}
                  placeholder="e.g. Indira Gandhi International Airport"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">City *</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.city}
                    onChange={e => setFormField('city', e.target.value)}
                    placeholder="e.g. New Delhi"
                  />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Country Code</label>
                  <input
                    type="text"
                    className="input-field uppercase"
                    value={form.countryCode}
                    onChange={e => setFormField('countryCode', e.target.value.toUpperCase())}
                    placeholder="e.g. IN"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="label-text">Timezone</label>
                  <input
                    type="text"
                    className="input-field"
                    value={form.timezone}
                    onChange={e => setFormField('timezone', e.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                  />
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
