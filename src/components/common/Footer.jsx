import { Link } from 'react-router-dom';
import { Plane, Mail, Phone, MapPin } from 'lucide-react';

const COL = {
  Company:  [{ label: 'About Us', to: '#' }, { label: 'Careers', to: '#' }, { label: 'Press', to: '#' }, { label: 'Blog', to: '#' }],
  Support:  [{ label: 'Help Center', to: '#' }, { label: 'Contact Us', to: '#' }, { label: 'Cancellation Policy', to: '#' }, { label: 'Baggage Info', to: '#' }],
  Legal:    [{ label: 'Privacy Policy', to: '#' }, { label: 'Terms of Service', to: '#' }, { label: 'Cookie Policy', to: '#' }],
  Explore:  [{ label: 'Search Flights', to: '/search' }, { label: 'My Bookings', to: '/dashboard/bookings' }, { label: 'Flight Status', to: '#' }],
};

const Footer = () => (
  <footer className="bg-navy-900 text-gray-300">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 text-white font-display font-bold text-lg mb-3">
            <Plane className="w-5 h-5" />
            FlightBook
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Book flights with confidence. Best prices, instant tickets, 24/7 support.
          </p>
          <div className="space-y-1.5 text-xs text-gray-500">
            <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@flightbook.com</div>
            <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 1800-XXX-XXXX</div>
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Mumbai, India</div>
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(COL).map(([title, links]) => (
          <div key={title}>
            <h3 className="text-white font-semibold text-sm mb-3">{title}</h3>
            <ul className="space-y-2">
              {links.map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} FlightBook. All rights reserved.</p>
        <div className="flex items-center gap-1">
          <span>Made with</span>
          <span className="text-red-400">♥</span>
          <span>for seamless travel</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
