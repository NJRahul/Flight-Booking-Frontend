import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './utils/constants';
import { useAuthStore } from './store/useAuthStore';
import QueryProvider from './context/QueryProvider';

// Auth guards
import ProtectedRoute from './components/auth/ProtectedRoute';

// Module 8 — real-time & common
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingPage from './components/common/LoadingPage';
import PublicLayout from './components/common/PublicLayout';
import RealTimeNotifications from './components/notifications/RealTimeNotifications';

// Module 8 — static pages
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';

// Module 3 — Flight Search
import HomePage from './pages/home/HomePage';
import FlightSearchPage from './pages/search/FlightSearchPage';

// Module 4 — Booking Flow
import FlightDetailPage from './pages/flights/FlightDetailPage';
import BookingPage from './pages/booking/BookingPage';

// Module 5 — Payment & Confirmation
import PaymentPage from './pages/payment/PaymentPage';
import ConfirmationPage from './pages/booking/ConfirmationPage';

// Module 6 — Dashboard
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import MyBookingsPage from './pages/dashboard/MyBookingsPage';
import BookingDetailPage from './pages/dashboard/BookingDetailPage';
import ProfilePage from './pages/dashboard/ProfilePage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import SavedSearchesPage from './pages/dashboard/SavedSearchesPage';

// Auth pages (Module 2)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

const PageSkeleton = () => <LoadingPage />;

const ComingSoon = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center card max-w-md">
      <div className="text-5xl mb-4">✈️</div>
      <h1 className="text-2xl font-bold font-display text-navy-900 mb-2">{title}</h1>
      <p className="text-gray-500 text-sm">This page will be implemented in an upcoming module.</p>
    </div>
  </div>
);

const App = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <QueryProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <RealTimeNotifications />
          <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public pages — wrapped in Navbar layout */}
            <Route element={<PublicLayout />}>
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.SEARCH} element={<FlightSearchPage />} />
              <Route path={ROUTES.FLIGHT_DETAILS} element={<FlightDetailPage />} />
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
              <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
            </Route>

            {/* Protected booking/payment — still use Navbar */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PublicLayout />}>
                <Route path="/booking/:flightId" element={<BookingPage />} />
                <Route path="/payment/:bookingId" element={<PaymentPage />} />
                <Route path="/booking/confirmation/:bookingId" element={<ConfirmationPage />} />
              </Route>

              {/* Dashboard — has its own sidebar layout */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="bookings" element={<MyBookingsPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="saved" element={<SavedSearchesPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: { duration: 3000, iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryProvider>
  );
};

export default App;
