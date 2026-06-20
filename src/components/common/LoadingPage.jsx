const LoadingPage = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
    <style>{`
      @keyframes planePath {
        0%   { transform: translate(0, 0) rotate(0deg); }
        25%  { transform: translate(40px, -30px) rotate(10deg); }
        50%  { transform: translate(80px, 0px) rotate(0deg); }
        75%  { transform: translate(40px, 30px) rotate(-10deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
      }
      @keyframes fadeInUp {
        from { opacity:0; transform:translateY(8px); }
        to   { opacity:1; transform:translateY(0); }
      }
      .plane-anim { animation: planePath 2.4s ease-in-out infinite; }
      .text-anim  { animation: fadeInUp 0.8s ease forwards 0.3s; opacity: 0; }
    `}</style>

    <div className="relative w-40 h-40 flex items-center justify-center mb-4">
      {/* Dashed orbit */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 160 160">
        <ellipse cx="80" cy="80" rx="60" ry="40" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="6 4" />
      </svg>

      {/* Plane */}
      <div className="plane-anim">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path
            d="M6 24L24 8L42 24L34 26L30 40L24 34L18 40L14 26Z"
            fill="#2563eb"
          />
          <path d="M24 34L22 42L24 40L26 42Z" fill="#1d4ed8" />
        </svg>
      </div>
    </div>

    <p className="text-anim text-2xl font-bold font-display text-navy-900 tracking-tight">
      ✈ FlightBook
    </p>
    <p className="text-sm text-gray-400 mt-1">Loading your experience…</p>
  </div>
);

export default LoadingPage;
