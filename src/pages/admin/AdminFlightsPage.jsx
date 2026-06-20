import { useEffect, useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  Plus, Search, Filter, MoreVertical, Edit, Trash2, Power, AlertCircle,
  Plane, ChevronLeft, ChevronRight, X, Check, Clock,
} from 'lucide-react';
import { adminApi } from '../../api/axios';
import toast from 'react-hot-toast';

const statusColors = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  delayed: 'bg-amber-50 text-amber-700 border-amber-200',
  boarding: 'bg-green-50 text-green-700 border-green-200',
  departed: 'bg-gray-50 text-gray-600 border-gray-200',
  arrived: 'bg-gray-50 text-gray-600 border-gray-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const defaultForm = {
  flightNumber: '',
  airline: '',
  origin: '',
  destination: '',
  departureTime: '',
  arrivalTime: '',
  aircraft: { type: '' },
  terminal: '',
  gate: '',
  seats: {
    economy: { total: 120, available: 120, price: 5000 },
    business: { total: 20, available: 20, price: 15000 },
    first: { total: 9, available: 9, price: 30000 },
  },
  baggage: { cabin: 7, checked: 20 },
  amenities: { wifi: false, meals: true, entertainment: false, usb: true },
  isActive: true,
  status: 'scheduled',
};

function SkeletonRows({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <tr key={i} className="animate-pulse">
      {Array.from({ length: 10 }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded-lg" />
        </td>
      ))}
    </tr>
  ));
}

export default function AdminFlightsPage() {
  const [flights, setFlights] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAirline, setFilterAirline] = useState('');
  const [airlines, setAirlines] = useState([]);

  const [statusModal, setStatusModal] = useState(null);
  const [flightModal, setFlightModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const [newStatus, setNewStatus] = useState('');
  const [delayMinutes, setDelayMinutes] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [notifyPassengers, setNotifyPassengers] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [form, setForm] = useState(defaultForm);
  const [airports, setAirports] = useState([]);
  const [savingFlight, setSavingFlight] = useState(false);

  const menuRef = useRef(null);

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterAirline) params.airline = filterAirline;
      const r = await adminApi.get('/flights', { params });
      setFlights(r.data.data?.flights || []);
      setTotal(r.data.data?.total || 0);
    } catch {
      toast.error('Failed to load flights');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterAirline]);

  useEffect(() => { fetchFlights(); }, [fetchFlights]);

  useEffect(() => {
    adminApi.get('/airlines')
      .then(r => setAirlines(r.data.data?.airlines || []))
      .catch(() => {});
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (flightModal && flightModal !== 'create') {
      setForm({
        ...flightModal,
        airline: flightModal.airline?._id || '',
        origin: flightModal.origin?._id || '',
        destination: flightModal.destination?._id || '',
        departureTime: flightModal.departureTime?.slice(0, 16) || '',
        arrivalTime: flightModal.arrivalTime?.slice(0, 16) || '',
      });
    } else if (flightModal === 'create') {
      setForm(defaultForm);
    }
  }, [flightModal]);

  // Fetch airports when flight modal opens
  useEffect(() => {
    if (flightModal !== null) {
      adminApi.get('/airports?limit=100')
        .then(r => setAirports(r.data.data?.airports || []))
        .catch(() => {});
    }
  }, [flightModal]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleStatusUpdate = async () => {
    if (!newStatus || !statusModal) return;
    setUpdatingStatus(true);
    try {
      await adminApi.patch(`/flights/${statusModal.flight._id}/status`, {
        status: newStatus,
        delayMinutes: delayMinutes ? parseInt(delayMinutes) : 0,
        reason: statusReason,
        notifyPassengers,
      });
      toast.success(`Flight status updated to ${newStatus}`);
      setStatusModal(null);
      fetchFlights();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (flight) => {
    try {
      await adminApi.delete(`/flights/${flight._id}`);
      toast.success('Flight deactivated');
      setDeleteConfirm(null);
      fetchFlights();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSaveFlight = async () => {
    setSavingFlight(true);
    try {
      if (flightModal === 'create') {
        await adminApi.post('/flights', form);
        toast.success('Flight created');
      } else {
        await adminApi.put(`/flights/${flightModal._id}`, form);
        toast.success('Flight updated');
      }
      setFlightModal(null);
      fetchFlights();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Save failed');
    } finally {
      setSavingFlight(false);
    }
  };

  const setFormField = (path, value) => {
    setForm(prev => {
      const keys = path.split('.');
      if (keys.length === 1) return { ...prev, [keys[0]]: value };
      if (keys.length === 2) return { ...prev, [keys[0]]: { ...prev[keys[0]], [keys[1]]: value } };
      if (keys.length === 3) return {
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: { ...prev[keys[0]][keys[1]], [keys[2]]: value },
        },
      };
      return prev;
    });
  };

  const totalPages = Math.ceil(total / limit);

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('');
    setFilterAirline('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flight Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} flights total</p>
        </div>
        <button
          onClick={() => setFlightModal('create')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Flight
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input-field pl-9"
            placeholder="Flight number..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="select-field w-auto min-w-[150px]"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="delayed">Delayed</option>
          <option value="boarding">Boarding</option>
          <option value="cancelled">Cancelled</option>
          <option value="departed">Departed</option>
          <option value="arrived">Arrived</option>
        </select>

        <select
          className="select-field w-auto min-w-[150px]"
          value={filterAirline}
          onChange={e => { setFilterAirline(e.target.value); setPage(1); }}
        >
          <option value="">All Airlines</option>
          {airlines.map(a => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>

        {(search || filterStatus || filterAirline) && (
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Flight #</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Airline</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Route</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Departure</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Arrival</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Duration</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Economy</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Business</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRows count={8} />
              ) : flights.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    <Plane className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No flights found</p>
                    <p className="text-xs mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                flights.map(f => (
                  <tr key={f._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary-600 font-mono text-sm">{f.flightNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {f.airline?.code}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">{f.airline?.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm whitespace-nowrap">{f.origin?.code} → {f.destination?.code}</p>
                        <p className="text-xs text-gray-400 whitespace-nowrap">{f.origin?.city} → {f.destination?.city}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {f.departureTime ? (
                        <div>
                          <p className="text-sm">{format(new Date(f.departureTime), 'dd MMM')}</p>
                          <p className="text-xs font-semibold text-gray-700">{format(new Date(f.departureTime), 'HH:mm')}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {f.arrivalTime ? (
                        <div>
                          <p className="text-sm">{format(new Date(f.arrivalTime), 'dd MMM')}</p>
                          <p className="text-xs font-semibold text-gray-700">{format(new Date(f.arrivalTime), 'HH:mm')}</p>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {f.duration != null ? `${Math.floor(f.duration / 60)}h ${f.duration % 60}m` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setStatusModal({ flight: f }); setNewStatus(f.status); setDelayMinutes(''); setStatusReason(''); setNotifyPassengers(true); }}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer capitalize hover:opacity-80 transition-opacity ${statusColors[f.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                      >
                        {f.status}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${f.seats?.economy?.available < 5 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {f.seats?.economy?.available ?? '—'}/{f.seats?.economy?.total ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${f.seats?.business?.available < 5 ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        {f.seats?.business?.available ?? '—'}/{f.seats?.business?.total ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative" ref={activeMenu === f._id ? menuRef : null}>
                        <button
                          onClick={() => setActiveMenu(activeMenu === f._id ? null : f._id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {activeMenu === f._id && (
                          <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                            <button
                              onClick={() => { setFlightModal(f); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit Flight
                            </button>
                            <button
                              onClick={() => { setStatusModal({ flight: f }); setNewStatus(f.status); setDelayMinutes(''); setStatusReason(''); setNotifyPassengers(true); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              Update Status
                            </button>
                            <div className="border-t border-gray-100 my-1" />
                            <button
                              onClick={() => { setDeleteConfirm(f); setActiveMenu(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Power className="w-3.5 h-3.5" />
                              Deactivate
                            </button>
                          </div>
                        )}
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

      {/* ── STATUS UPDATE MODAL ── */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Update Flight Status</h2>
              <button onClick={() => setStatusModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Flight:{' '}
              <span className="font-mono font-semibold text-gray-900">{statusModal.flight.flightNumber}</span>
              {' · '}Current:{' '}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[statusModal.flight.status]}`}>
                {statusModal.flight.status}
              </span>
            </p>

            <div>
              <label className="label-text">New Status</label>
              <select className="select-field" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                {['scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled'].map(s => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>

            {newStatus === 'delayed' && (
              <div>
                <label className="label-text">Delay (minutes)</label>
                <input
                  type="number"
                  className="input-field"
                  value={delayMinutes}
                  onChange={e => setDelayMinutes(e.target.value)}
                  min="1"
                  placeholder="e.g. 45"
                />
              </div>
            )}

            <div>
              <label className="label-text">Reason</label>
              <input
                type="text"
                className="input-field"
                value={statusReason}
                onChange={e => setStatusReason(e.target.value)}
                placeholder="e.g. Technical issue, Weather..."
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyPassengers}
                onChange={e => setNotifyPassengers(e.target.checked)}
                className="rounded"
              />
              Notify affected passengers via email &amp; in-app
            </label>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStatusModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleStatusUpdate} disabled={updatingStatus} className="flex-1 btn-primary">
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT FLIGHT MODAL ── */}
      {flightModal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {flightModal === 'create' ? 'Add New Flight' : `Edit Flight — ${flightModal.flightNumber}`}
              </h2>
              <button onClick={() => setFlightModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {/* Basic Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Basic Info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Flight Number</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.flightNumber}
                      onChange={e => setFormField('flightNumber', e.target.value)}
                      placeholder="e.g. AI-101"
                    />
                  </div>
                  <div>
                    <label className="label-text">Airline</label>
                    <select
                      className="select-field"
                      value={form.airline}
                      onChange={e => setFormField('airline', e.target.value)}
                    >
                      <option value="">Select airline</option>
                      {airlines.map(a => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label-text">Aircraft Type</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.aircraft?.type || ''}
                      onChange={e => setFormField('aircraft.type', e.target.value)}
                      placeholder="e.g. Boeing 737, Airbus A320"
                    />
                  </div>
                </div>
              </div>

              {/* Route */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Route</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Origin</label>
                    <select
                      className="select-field"
                      value={form.origin}
                      onChange={e => setFormField('origin', e.target.value)}
                    >
                      <option value="">Select airport</option>
                      {airports.map(a => (
                        <option key={a._id} value={a._id}>{a.code} — {a.city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Destination</label>
                    <select
                      className="select-field"
                      value={form.destination}
                      onChange={e => setFormField('destination', e.target.value)}
                    >
                      <option value="">Select airport</option>
                      {airports.map(a => (
                        <option key={a._id} value={a._id}>{a.code} — {a.city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Terminal</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.terminal}
                      onChange={e => setFormField('terminal', e.target.value)}
                      placeholder="e.g. T2"
                    />
                  </div>
                  <div>
                    <label className="label-text">Gate</label>
                    <input
                      type="text"
                      className="input-field"
                      value={form.gate}
                      onChange={e => setFormField('gate', e.target.value)}
                      placeholder="e.g. G14"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Schedule</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Departure</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={form.departureTime}
                      onChange={e => setFormField('departureTime', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-text">Arrival</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={form.arrivalTime}
                      onChange={e => setFormField('arrivalTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pricing (₹)</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label-text">Economy</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.seats?.economy?.price || ''}
                      onChange={e => setFormField('seats.economy.price', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="label-text">Business</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.seats?.business?.price || ''}
                      onChange={e => setFormField('seats.business.price', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="label-text">First</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.seats?.first?.price || ''}
                      onChange={e => setFormField('seats.first.price', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Seats */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Seats (Total / Available)</p>
                <div className="grid grid-cols-3 gap-4">
                  {['economy', 'business', 'first'].map(cls => (
                    <div key={cls} className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 capitalize">{cls}</p>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Total"
                        value={form.seats?.[cls]?.total || ''}
                        onChange={e => setFormField(`seats.${cls}.total`, Number(e.target.value))}
                        min="0"
                      />
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Available"
                        value={form.seats?.[cls]?.available || ''}
                        onChange={e => setFormField(`seats.${cls}.available`, Number(e.target.value))}
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Baggage */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Baggage Allowance (kg)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Cabin</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.baggage?.cabin || ''}
                      onChange={e => setFormField('baggage.cabin', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="label-text">Checked</label>
                    <input
                      type="number"
                      className="input-field"
                      value={form.baggage?.checked || ''}
                      onChange={e => setFormField('baggage.checked', Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Amenities</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'wifi', label: 'Wi-Fi' },
                    { key: 'meals', label: 'Meals' },
                    { key: 'entertainment', label: 'Entertainment' },
                    { key: 'usb', label: 'USB Charging' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.amenities?.[key] || false}
                        onChange={e => setFormField(`amenities.${key}`, e.target.checked)}
                        className="rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Options</p>
                <div className="flex flex-wrap gap-6 items-center">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={e => setFormField('isActive', e.target.checked)}
                      className="rounded"
                    />
                    Active
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="label-text mb-0">Status</label>
                    <select
                      className="select-field w-auto"
                      value={form.status}
                      onChange={e => setFormField('status', e.target.value)}
                    >
                      {['scheduled', 'boarding', 'departed', 'arrived', 'delayed', 'cancelled'].map(s => (
                        <option key={s} value={s} className="capitalize">{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setFlightModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={handleSaveFlight} disabled={savingFlight} className="flex-1 btn-primary">
                {savingFlight ? 'Saving...' : flightModal === 'create' ? 'Create Flight' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Deactivate Flight?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Are you sure you want to deactivate{' '}
                  <span className="font-mono font-semibold text-gray-800">{deleteConfirm.flightNumber}</span>?
                  This action can be reversed later.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 btn-secondary">Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 font-semibold hover:bg-red-700 transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
