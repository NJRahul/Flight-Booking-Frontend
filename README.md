# FlightBook — Frontend

User-facing web application for the FlightBook flight booking and reservation platform. Built with React 18, Vite, TailwindCSS, and Zustand.

**Linked repositories**
- Backend API: [Flight-Booking-Backend](https://github.com/NJRahul/Flight-Booking-Backend)
- Admin Dashboard: [Flight-Booking-Admin](https://github.com/NJRahul/Flight-Booking-Admin)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite |
| Styling | TailwindCSS |
| State | Zustand |
| Server state | TanStack React Query |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Payments | Stripe.js / React Stripe.js |
| Real-time | Socket.io-client |
| Icons | Lucide React |

---

## Features

- **Home Page** — animated hero, destination cards, airline marquee, testimonials
- **Flight Search** — one-way and round-trip search, airport autocomplete, passenger selector, date pickers
- **Search Results** — sticky filter sidebar (price / stops / airlines / departure bands), sort bar, best-pick row, expandable flight cards with 4 detail tabs, pagination
- **Booking Flow** — multi-step (passengers → seats → review), seat map, price breakdown
- **Payments** — Stripe card form integrated into checkout
- **User Dashboard** — profile, my bookings, booking detail, notifications, saved searches
- **Auth** — login, register (with password strength meter), forgot password, reset password
- **Real-time** — live flight status updates and notifications via Socket.io
- **Responsive** — mobile filter drawer, fully responsive layout

---

## Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/search` | Flight Search Results |
| `/flights/:id` | Flight Detail |
| `/booking` | Booking Flow |
| `/booking/confirmation` | Booking Confirmation |
| `/payment` | Payment |
| `/login` | Login |
| `/register` | Register |
| `/forgot-password` | Forgot Password |
| `/reset-password/:token` | Reset Password |
| `/dashboard` | User Dashboard |
| `/dashboard/bookings` | My Bookings |
| `/dashboard/bookings/:id` | Booking Detail |
| `/dashboard/notifications` | Notifications |
| `/dashboard/saved-searches` | Saved Searches |
| `/dashboard/profile` | Profile Settings |

---

## Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/NJRahul/Flight-Booking-Frontend.git
cd Flight-Booking-Frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

> Make sure the backend is running at `http://localhost:5000` before starting the frontend.

---

## Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

> Get your Stripe publishable key from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys). Use test mode keys during development.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@flightbook.com` | `Admin@1234` |
| **User** | `alice@example.com` | `Alice@1234` |
| **User** | `bob@example.com` | `Bob@12345` |

> Run `npm run seed` in the backend to create these accounts.

---

## Stripe Test Cards

| Card | Number | Expiry | CVC |
|---|---|---|---|
| Visa (success) | `4242 4242 4242 4242` | Any future date | Any 3 digits |
| Auth required | `4000 0025 0000 3155` | Any future date | Any 3 digits |
| Declined | `4000 0000 0000 9995` | Any future date | Any 3 digits |

---

## Scripts

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## License

MIT
