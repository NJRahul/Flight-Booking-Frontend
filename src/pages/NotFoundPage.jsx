import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
    <div className="relative mb-8">
      {/* Animated plane */}
      <svg
        className="w-32 h-32 text-primary-200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ animation: 'float 3s ease-in-out infinite' }}
      >
        <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }`}</style>
        <circle cx="100" cy="100" r="90" fill="#eff6ff" />
        <path
          d="M60 110 L140 80 L130 100 L120 130 L100 110 L80 120 Z"
          fill="#2563eb"
          opacity="0.8"
        />
        <path d="M100 110 L110 90 L130 100 Z" fill="#1d4ed8" />
        <path d="M80 120 L70 135 L90 125 Z" fill="#1d4ed8" />
      </svg>
    </div>

    <h1 className="text-8xl font-black font-display text-primary-600 mb-3">404</h1>
    <h2 className="text-2xl font-bold text-navy-900 mb-2">Looks like this page took a different route</h2>
    <p className="text-gray-500 text-sm mb-8 max-w-xs">
      The page you're looking for doesn't exist or has been moved. Let's get you back on track.
    </p>

    <div className="flex flex-col sm:flex-row gap-3">
      <Link
        to="/"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
      >
        ✈ Go Home
      </Link>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        ← Go Back
      </button>
    </div>
  </div>
);

export default NotFoundPage;
