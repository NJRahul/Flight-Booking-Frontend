import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorPage = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
    <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
      <AlertTriangle className="w-10 h-10 text-red-500" />
    </div>

    <h1 className="text-2xl font-bold font-display text-navy-900 mb-2">Something went wrong</h1>
    <p className="text-gray-500 text-sm mb-2 max-w-xs">
      An unexpected error occurred. You can try again or return to the home page.
    </p>
    {error?.message && (
      <p className="text-xs text-gray-400 font-mono bg-gray-100 px-3 py-1.5 rounded-lg mb-6 max-w-sm truncate">
        {error.message}
      </p>
    )}

    <div className="flex flex-col sm:flex-row gap-3">
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <Home className="w-4 h-4" />
        Go Home
      </Link>
    </div>
  </div>
);

export default ErrorPage;
