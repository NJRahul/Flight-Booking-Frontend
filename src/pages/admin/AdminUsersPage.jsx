import { useEffect, useState, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Search, Filter, Users, UserCheck, UserX, Shield, ChevronLeft, ChevronRight,
  Eye, X, BookOpen, TrendingUp,
} from 'lucide-react';
import { adminApi } from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, label, value }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-semibold">Admin</span>
  ) : (
    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-semibold">User</span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }) {
  return isActive ? (
    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">Active</span>
  ) : (
    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">Inactive</span>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────
function UserDrawer({ drawer, loadingDrawer, onClose, onToggleRole, onToggleActive, togglingUser }) {
  if (!drawer) return null;
  const { user, bookings, stats } = drawer;

  const handleResetPassword = () => {
    toast.success('Password reset email sent to user');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingDrawer ? (
            <div className="space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {/* Profile card */}
              <div className="card p-5 flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  {user?.phone && <p className="text-sm text-gray-400">{user.phone}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <RoleBadge role={user?.role} />
                    <StatusBadge isActive={user?.isActive} />
                  </div>
                </div>
              </div>

              {/* Member since */}
              {user?.createdAt && (
                <p className="text-xs text-gray-400">
                  Member since {format(new Date(user.createdAt), 'dd MMM yyyy')}
                </p>
              )}

              {/* Stats strip */}
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Bookings</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(stats?.spent || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total Spent</p>
                </div>
              </div>

              {/* Recent bookings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Bookings</h3>
                {bookings.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No bookings found</p>
                ) : (
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-xs min-w-[480px]">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                          <th className="pb-2 text-left font-medium px-1">Ref</th>
                          <th className="pb-2 text-left font-medium px-1">Route</th>
                          <th className="pb-2 text-left font-medium px-1">Date</th>
                          <th className="pb-2 text-left font-medium px-1">Class</th>
                          <th className="pb-2 text-right font-medium px-1">Amount</th>
                          <th className="pb-2 text-center font-medium px-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 10).map((b, i) => (
                          <tr key={b._id || i} className="border-b border-gray-50 last:border-0">
                            <td className="py-2 px-1 font-mono text-gray-600">
                              {b.bookingReference}
                            </td>
                            <td className="py-2 px-1 text-gray-800 font-medium">
                              {b.flight?.origin?.code || '—'} → {b.flight?.destination?.code || '—'}
                            </td>
                            <td className="py-2 px-1 text-gray-500">
                              {b.flight?.departureTime
                                ? format(new Date(b.flight.departureTime), 'dd MMM')
                                : '—'}
                            </td>
                            <td className="py-2 px-1 text-gray-500 capitalize">
                              {b.class || b.seatClass || '—'}
                            </td>
                            <td className="py-2 px-1 text-right font-medium text-gray-800">
                              ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-2 px-1 text-center">
                              <BookingStatusBadge status={b.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Account actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Actions</h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => onToggleRole(user)}
                    disabled={togglingUser === user?._id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <Shield className="w-4 h-4" />
                    Toggle Admin Role
                  </button>

                  {user?.isActive ? (
                    <button
                      onClick={() => onToggleActive(user)}
                      disabled={togglingUser === user?._id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4" />
                      Deactivate Account
                    </button>
                  ) : (
                    <button
                      onClick={() => onToggleActive(user)}
                      disabled={togglingUser === user?._id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="w-4 h-4" />
                      Activate Account
                    </button>
                  )}

                  <button
                    onClick={handleResetPassword}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Booking Status Badge (for drawer) ───────────────────────────────────────
function BookingStatusBadge({ status }) {
  const map = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
    'no-show': 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold capitalize ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, activeToday: 0, newThisMonth: 0, admins: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [drawer, setDrawer] = useState(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [togglingUser, setTogglingUser] = useState(null);

  const totalPages = Math.ceil(total / limit);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (filterRole) params.role = filterRole;
      if (filterActive !== '') params.isActive = filterActive;
      const r = await adminApi.get('/users', { params });
      setUsers(r.data.data?.users || []);
      setTotal(r.data.data?.total || 0);
      setStats(r.data.data?.stats || {});
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRole, filterActive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Search debounce ──────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Open user drawer ─────────────────────────────────────────────────────────
  const openDrawer = async (user) => {
    setLoadingDrawer(true);
    setDrawer({ user, bookings: [], stats: {} });
    try {
      const r = await adminApi.get(`/users/${user._id}/detail`);
      setDrawer({
        user: r.data.data?.user || user,
        bookings: r.data.data?.bookings || [],
        stats: r.data.data?.stats || {},
      });
    } catch {
      toast.error('Failed to load user details');
    } finally {
      setLoadingDrawer(false);
    }
  };

  // ── Toggle role ──────────────────────────────────────────────────────────────
  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (newRole === 'admin' && !window.confirm(`Promote ${user.name} to Admin?`)) return;
    setTogglingUser(user._id);
    try {
      await adminApi.patch(`/users/${user._id}`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
      // Update drawer if open
      if (drawer?.user?._id === user._id) {
        setDrawer(prev => prev ? { ...prev, user: { ...prev.user, role: newRole } } : null);
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setTogglingUser(null);
    }
  };

  // ── Toggle active ────────────────────────────────────────────────────────────
  const toggleActive = async (user) => {
    const newActive = !user.isActive;
    if (!newActive && !window.confirm(`Deactivate ${user.name}'s account?`)) return;
    setTogglingUser(user._id);
    try {
      await adminApi.patch(`/users/${user._id}`, { isActive: newActive });
      toast.success(`Account ${newActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
      if (drawer?.user?._id === user._id) {
        setDrawer(prev => prev ? { ...prev, user: { ...prev.user, isActive: newActive } } : null);
      }
    } catch {
      toast.error('Update failed');
    } finally {
      setTogglingUser(null);
    }
  };

  // ── Reset filters ────────────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setFilterRole('');
    setFilterActive('');
    setPage(1);
  };

  const hasFilters = searchInput || filterRole || filterActive !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 font-display">User Management</h1>
        <span className="text-sm text-gray-500">{total.toLocaleString()} total users</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          iconBg="bg-primary-100 text-primary-600"
          label="Total Users"
          value={(stats.total || 0).toLocaleString()}
        />
        <StatCard
          icon={UserCheck}
          iconBg="bg-green-100 text-green-600"
          label="Active Today"
          value={stats.activeToday ?? 0}
        />
        <StatCard
          icon={TrendingUp}
          iconBg="bg-amber-100 text-amber-600"
          label="New This Month"
          value={stats.newThisMonth ?? 0}
        />
        <StatCard
          icon={Shield}
          iconBg="bg-purple-100 text-purple-600"
          label="Admins"
          value={stats.admins ?? 0}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Name, email, phone..."
            className="input-field pl-9 w-full"
          />
        </div>

        {/* Role filter */}
        <select
          value={filterRole}
          onChange={e => { setFilterRole(e.target.value); setPage(1); }}
          className="select-field min-w-[130px]"
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        {/* Status filter */}
        <select
          value={filterActive}
          onChange={e => { setFilterActive(e.target.value); setPage(1); }}
          className="select-field min-w-[130px]"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Bookings</th>
                <th className="px-4 py-3 text-left">Spent</th>
                <th className="px-4 py-3 text-left">Last Login</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.phone || '—'}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Bookings */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                        {user.bookingCount || 0}
                      </div>
                    </td>

                    {/* Spent */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ₹{(user.totalSpent || 0).toLocaleString('en-IN')}
                    </td>

                    {/* Last Login */}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastLogin
                        ? formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })
                        : 'Never'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge isActive={user.isActive} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View */}
                        <button
                          onClick={() => openDrawer(user)}
                          disabled={togglingUser === user._id}
                          title="View details"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-50"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Toggle role */}
                        <button
                          onClick={() => toggleRole(user)}
                          disabled={togglingUser === user._id}
                          title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                        >
                          <Shield className="w-4 h-4" />
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={togglingUser === user._id}
                          title={user.isActive ? 'Deactivate account' : 'Activate account'}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 ${
                            user.isActive
                              ? 'text-gray-500 hover:text-red-600'
                              : 'text-gray-500 hover:text-green-600'
                          }`}
                        >
                          {user.isActive
                            ? <UserX className="w-4 h-4" />
                            : <UserCheck className="w-4 h-4" />}
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
        {!loading && total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User detail drawer */}
      <UserDrawer
        drawer={drawer}
        loadingDrawer={loadingDrawer}
        onClose={() => setDrawer(null)}
        onToggleRole={toggleRole}
        onToggleActive={toggleActive}
        togglingUser={togglingUser}
      />
    </div>
  );
}
