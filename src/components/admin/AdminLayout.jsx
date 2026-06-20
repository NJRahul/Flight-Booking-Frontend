import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import AdminGlobalSearch from './AdminGlobalSearch';
import {
  LayoutDashboard, BarChart2, Plane, ClipboardList, Users, Shield, MapPin,
  Bell, FileText, Settings, LogOut, ExternalLink, Menu, X, Search,
} from 'lucide-react';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/admin/flights', icon: Plane, label: 'Flights' },
      { to: '/admin/bookings', icon: ClipboardList, label: 'Bookings' },
      { to: '/admin/users', icon: Users, label: 'Users' },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { to: '/admin/airlines', icon: Shield, label: 'Airlines' },
      { to: '/admin/airports', icon: MapPin, label: 'Airports' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { to: '/admin/reports', icon: FileText, label: 'Reports' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

function SidebarContent({ onNavClick, logout }) {
  const { user } = useAuthStore();
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">✈ FlightBook Admin</span>
          <span className="ml-2 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-medium">
            Admin
          </span>
        </div>
      </div>

      <div className="px-4 py-3 mx-2 mt-2 bg-slate-800 rounded-xl flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-amber-400 font-medium capitalize">{user?.role || 'admin'}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold px-4 mt-4 mb-1">
              {group.label}
            </p>
            {group.items.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-xl mx-2 text-sm font-medium transition-all mb-0.5 ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-700 p-4 space-y-1 shrink-0">
        <Link
          to="/"
          onClick={onNavClick}
          className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-white"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          <span>Back to Website</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all text-slate-400 hover:text-red-400"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname
    .split('/')
    .filter(Boolean)
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1));

  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-500">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-300">/</span>}
          <span className={i === segments.length - 1 ? 'font-semibold text-gray-800' : ''}>
            {seg}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'A';

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-slate-900 fixed left-0 top-0 bottom-0 flex-col z-30">
        <SidebarContent onNavClick={undefined} logout={handleLogout} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 flex flex-col z-50 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700 shrink-0">
          <span className="text-white font-bold">✈ FlightBook Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent onNavClick={() => setSidebarOpen(false)} logout={handleLogout} />
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="h-14 bg-white border-b border-gray-100 ml-0 lg:ml-64 sticky top-0 z-20 flex items-center px-4 gap-3">
        <button
          className="lg:hidden text-gray-500 hover:text-gray-700 p-1 transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <Breadcrumb />
        </div>

        <div className="flex-1 flex justify-center">
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-400 transition-colors max-w-xs w-full"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">Search flights, bookings, users...</span>
            <kbd className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono shrink-0">
              Ctrl K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-none max-w-[120px] truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 leading-tight mt-0.5">Admin</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="ml-0 lg:ml-64 min-h-screen bg-gray-50">
        <div className="h-14" />
        <div className="p-6">
          <Outlet />
        </div>
      </main>

      {/* Global Search */}
      <AdminGlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
