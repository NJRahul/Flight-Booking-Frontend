import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Headphones, RefreshCw, Plane, Search, MapPin, Star, Mail, Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';
import FlightSearchWidget from '../../components/search/FlightSearchWidget';
import { ROUTES } from '../../utils/constants';
import { format, addDays } from 'date-fns';

// ── Animated counter ──────────────────────────────────────────────────────────

const useCounter = (target, duration = 1800) => {
  const [count, setCount] = useState(0);
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated) {
          setAnimated(true);
          let start = 0;
          const inc = target / (duration / 16);
          const timer = setInterval(() => {
            start += inc;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, animated]);

  return { count, ref };
};

// ── Static data ───────────────────────────────────────────────────────────────

const DESTINATIONS = [
  { city: 'Dubai', code: 'DXB', price: '₹12,499', gradient: 'from-amber-600 to-orange-500', textBg: 'bg-amber-600' },
  { city: 'Singapore', code: 'SIN', price: '₹18,999', gradient: 'from-emerald-600 to-teal-500', textBg: 'bg-emerald-600' },
  { city: 'London', code: 'LHR', price: '₹45,999', gradient: 'from-slate-600 to-blue-700', textBg: 'bg-slate-600' },
  { city: 'Bangkok', code: 'BKK', price: '₹14,299', gradient: 'from-purple-600 to-pink-500', textBg: 'bg-purple-600' },
  { city: 'Goa', code: 'GOI', price: '₹3,999', gradient: 'from-cyan-600 to-sky-500', textBg: 'bg-cyan-600' },
  { city: 'New Delhi', code: 'DEL', price: '₹2,799', gradient: 'from-red-600 to-rose-500', textBg: 'bg-red-600' },
  { city: 'Tokyo', code: 'NRT', price: '₹42,999', gradient: 'from-pink-600 to-fuchsia-500', textBg: 'bg-pink-600' },
  { city: 'Doha', code: 'DOH', price: '₹16,799', gradient: 'from-violet-600 to-indigo-500', textBg: 'bg-violet-600' },
];

const AIRLINE_NAMES = ['Air India', 'IndiGo', 'Vistara', 'SpiceJet', 'Emirates', 'Singapore Airlines', 'Qatar Airways', 'British Airways', 'Lufthansa', 'Air Asia'];

const TESTIMONIALS = [
  { name: 'Priya Sharma', route: 'Mumbai → Dubai', rating: 5, text: 'Found an amazing deal in just 2 minutes! The seat selection and booking process were incredibly smooth. Will definitely use FlightBook again.' },
  { name: 'Rajesh Kumar', route: 'Delhi → London', rating: 5, text: 'Best prices I found anywhere online. The filter options made it easy to find a non-stop flight that fit my schedule perfectly.' },
  { name: 'Anita Patel', route: 'Bangalore → Singapore', rating: 4, text: 'Great platform with a clean interface. Loved the real-time flight tracking feature. Customer support was also very responsive.' },
];

const STARS = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 85}%`,
  left: `${Math.random() * 100}%`,
  size: `${Math.random() * 2.5 + 1}px`,
  delay: `${Math.random() * 4}s`,
}));

// ── Sub-sections ──────────────────────────────────────────────────────────────

const StatItem = ({ value, suffix, label }) => {
  const { count, ref } = useCounter(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl font-bold text-white">
        {count.toLocaleString('en-IN')}{suffix}
      </p>
      <p className="text-primary-200 text-sm mt-1">{label}</p>
    </div>
  );
};

const NewsletterSection = () => {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setDone(true);
    setEmail('');
  };

  return (
    <section className="bg-primary-50 py-16">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mail className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold font-display text-navy-900 mb-2">Get the best flight deals</h2>
        <p className="text-gray-500 mb-7 text-sm">Subscribe and be first to know about price drops, flash sales, and exclusive offers.</p>
        {done ? (
          <p className="text-success-700 font-medium">🎉 You're subscribed! Check your inbox for a welcome email.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary px-6 whitespace-nowrap">Subscribe</button>
          </form>
        )}
      </div>
    </section>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const HomePage = () => {
  const navigate = useNavigate();
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const handleDestinationClick = (dest) => {
    const params = new URLSearchParams({
      from: 'DEL', fromCity: 'New Delhi',
      to: dest.code, toCity: dest.city,
      departureDate: tomorrow,
      adults: 1, children: 0, infants: 0,
      class: 'economy', tripType: 'one-way',
    });
    navigate(`${ROUTES.SEARCH}?${params}`);
  };

  return (
    <div className="min-h-screen">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Stars */}
        {STARS.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              top: s.top, left: s.left, width: s.size, height: s.size,
              animation: `pulse 3s ${s.delay} infinite`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}

        {/* Floating plane */}
        <div
          className="absolute top-1/4 opacity-10"
          style={{ animation: 'floatPlane 28s linear infinite' }}
        >
          <Plane className="w-24 h-24 text-white -rotate-12" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-20 pb-32 flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8">
            <span className="text-xl">✈️</span>
            <span className="text-white/90 text-sm font-medium">500+ Airlines · 1M+ Happy Travelers</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold font-display text-white leading-tight mb-5">
            Your Journey<br />
            <span className="text-primary-300">Starts Here</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-12 max-w-xl">
            Search, compare and book flights worldwide. Best prices guaranteed.
          </p>

          {/* Search widget — overlaps into next section */}
          <div className="w-full max-w-7xl mb-[-4rem]">
            <FlightSearchWidget />
          </div>
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes floatPlane {
            from { transform: translateX(-10vw) translateY(0); }
            to   { transform: translateX(110vw) translateY(-40px); }
          }
        `}</style>
      </section>

      {/* ── POPULAR DESTINATIONS ─────────────────────────────────────────── */}
      <section className="bg-gray-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-display text-navy-900 mb-2">Popular Destinations</h2>
            <p className="text-gray-500 text-sm">This Week's Best Deals</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {DESTINATIONS.map((dest) => (
              <div
                key={dest.code}
                onClick={() => handleDestinationClick(dest)}
                className="relative rounded-2xl overflow-hidden cursor-pointer group h-44"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dest.gradient}`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* IATA badge */}
                <div className="absolute top-3 right-3">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">
                    {dest.code}
                  </span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-bold text-lg leading-tight">{dest.city}</p>
                  <p className="text-white/80 text-xs">from {dest.price}</p>
                </div>

                <div className="absolute inset-0 ring-2 ring-inset ring-white/0 group-hover:ring-white/30 rounded-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl" style={{ transform: 'scale(1)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AIRLINES MARQUEE ─────────────────────────────────────────────── */}
      <section className="bg-white py-8 border-y border-gray-100 overflow-hidden">
        <p className="text-center text-xs text-gray-400 uppercase tracking-widest mb-5">We partner with 500+ airlines worldwide</p>
        <div className="relative">
          <div className="flex gap-6 w-max animate-[marquee_25s_linear_infinite]">
            {[...AIRLINE_NAMES, ...AIRLINE_NAMES].map((name, i) => (
              <span key={i} className="bg-gray-50 border border-gray-100 text-gray-500 text-sm font-medium px-4 py-2 rounded-xl whitespace-nowrap">
                {name}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ── WHY FLIGHTBOOK ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-navy-900 text-center mb-10">Why FlightBook?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Best Price Guarantee', desc: 'We compare prices across hundreds of airlines to get you the absolute best deal every time.', color: 'bg-primary-50 text-primary-600' },
              { icon: Headphones, title: '24/7 Customer Support', desc: 'Our team is available around the clock to help with bookings, changes, and travel queries.', color: 'bg-success-50 text-success-700' },
              { icon: RefreshCw, title: 'Easy Cancellation', desc: 'Plans changed? Cancel or modify your booking hassle-free, with refunds processed quickly.', color: 'bg-accent-50 text-accent-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card card-hover text-center">
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold font-display text-navy-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-navy-900 text-center mb-12">How It Works</h2>
          <div className="relative flex flex-col md:flex-row gap-8 md:gap-0">
            {[
              { step: '01', icon: Search, title: 'Search Flights', desc: 'Enter your origin, destination and dates. We search 500+ airlines instantly.' },
              { step: '02', icon: MapPin, title: 'Compare & Filter', desc: 'Compare prices, durations and amenities. Filter by stops, time, airline and more.' },
              { step: '03', icon: Plane, title: 'Book & Fly', desc: 'Secure payment in seconds. Get instant confirmation and e-tickets.' },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="flex-1 flex flex-col items-center text-center relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-primary-100" style={{ zIndex: 0 }} />
                )}
                <div className="relative z-10 w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white font-bold text-sm">{step}</span>
                </div>
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold font-display text-navy-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section className="bg-navy-950 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatItem value={500} suffix="+" label="Airlines" />
          <StatItem value={150} suffix="+" label="Countries" />
          <StatItem value={1000000} suffix="+" label="Bookings" />
          <StatItem value={4.8} suffix="★" label="Average Rating" />
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold font-display text-navy-900 text-center mb-10">What Travelers Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card">
                <div className="flex gap-1 mb-3">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.route}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────────── */}
      <NewsletterSection />

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Plane className="w-4 h-4 text-white -rotate-45" />
                </div>
                <span className="font-bold font-display text-lg">FlightBook</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Your trusted partner for finding the best flights at the best prices, since 2020.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-200">Company</h4>
              {['About', 'Careers', 'Blog', 'Press'].map((l) => (
                <p key={l} className="text-gray-400 text-sm mb-2 hover:text-white cursor-pointer transition-colors">{l}</p>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-200">Support</h4>
              {['Help Center', 'Contact Us', 'Refunds', 'Privacy Policy'].map((l) => (
                <p key={l} className="text-gray-400 text-sm mb-2 hover:text-white cursor-pointer transition-colors">{l}</p>
              ))}
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-4 text-gray-200">Get the App</h4>
              <div className="space-y-2">
                {['App Store', 'Google Play'].map((l) => (
                  <div key={l} className="border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 hover:border-gray-500 cursor-pointer transition-colors">{l}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2025 FlightBook. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {[Twitter, Instagram, Facebook, Linkedin].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center hover:border-primary-500 hover:text-primary-400 transition-colors text-gray-400">
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
