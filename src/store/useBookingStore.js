import { create } from 'zustand';

export const useBookingStore = create((set, get) => ({
  // Flight + class selection
  flight: null,
  seatClass: 'economy',

  // Seat map selection
  selectedSeats: [], // e.g. ['14A', '14C']

  // Passenger form data (array matching passenger count)
  passengers: [],

  // Contact info
  contactInfo: {
    email: '',
    phone: '',
    emergencyContact: { name: '', phone: '' },
  },

  // Extras
  extras: {
    extraBaggage: false,
    travelInsurance: false,
    mealUpgrade: false,
    priorityBoarding: false,
  },

  // Search params (adults/children/infants count)
  searchParams: { adults: 1, children: 0, infants: 0, tripType: 'one-way' },

  // Step
  currentStep: 0,

  // Actions
  setFlight: (flight) => set({ flight }),
  setSeatClass: (seatClass) => set({ seatClass }),
  setSelectedSeats: (selectedSeats) => set({ selectedSeats }),
  setPassengers: (passengers) => set({ passengers }),
  updatePassenger: (index, data) => {
    const passengers = [...get().passengers];
    passengers[index] = { ...passengers[index], ...data };
    set({ passengers });
  },
  setContactInfo: (contactInfo) => set({ contactInfo }),
  setExtras: (extras) => set({ extras }),
  toggleExtra: (key) => {
    const extras = { ...get().extras, [key]: !get().extras[key] };
    set({ extras });
  },
  setSearchParams: (searchParams) => set({ searchParams }),
  setStep: (currentStep) => set({ currentStep }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 3) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),

  // Initialize passengers array from search params
  initPassengers: (adults, children, infants) => {
    const passengers = [];
    for (let i = 0; i < adults; i++)
      passengers.push({
        type: 'adult',
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        nationality: 'Indian',
        passportNumber: '',
        passportExpiry: '',
        mealPreference: 'standard',
        specialAssistance: '',
        seatNumber: '',
      });
    for (let i = 0; i < children; i++)
      passengers.push({
        type: 'child',
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        nationality: 'Indian',
        passportNumber: '',
        passportExpiry: '',
        mealPreference: 'standard',
        specialAssistance: '',
        seatNumber: '',
      });
    for (let i = 0; i < infants; i++)
      passengers.push({
        type: 'infant',
        title: 'Mr',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'male',
        nationality: 'Indian',
        passportNumber: '',
        passportExpiry: '',
        mealPreference: 'standard',
        specialAssistance: '',
      });
    set({ passengers, searchParams: { adults, children, infants } });
  },

  // Compute total price
  computeTotal: () => {
    const { flight, seatClass, passengers, extras } = get();
    if (!flight)
      return {
        baseTotal: 0,
        taxes: 0,
        fuelSurcharge: 0,
        convenienceFee: 99,
        extrasTotal: 0,
        totalAmount: 99,
        passengers: [],
        baseFare: 0,
      };

    const baseFare = flight.seats?.[seatClass]?.price || 0;
    const EXTRAS_PRICING = {
      extraBaggage: 1299,
      travelInsurance: 499,
      mealUpgrade: 299,
      priorityBoarding: 199,
    };
    const TAX_RATE = 0.18;
    const FUEL_RATE = 0.05;
    const paxCount = passengers.filter((p) => p.type !== 'infant').length || 1;

    let baseTotal = 0;
    passengers.forEach((p) => {
      if (p.type === 'adult') baseTotal += baseFare;
      else if (p.type === 'child') baseTotal += Math.round(baseFare * 0.75);
      else baseTotal += Math.round(baseFare * 0.1);
    });

    const taxableBase = passengers
      .filter((p) => p.type !== 'infant')
      .reduce(
        (s, p) =>
          s + (p.type === 'adult' ? baseFare : Math.round(baseFare * 0.75)),
        0
      );

    const taxes = Math.round(taxableBase * TAX_RATE);
    const fuelSurcharge = Math.round(taxableBase * FUEL_RATE);
    const extrasTotal = Object.entries(extras).reduce(
      (s, [k, v]) =>
        v && EXTRAS_PRICING[k] ? s + EXTRAS_PRICING[k] * paxCount : s,
      0
    );
    const totalAmount = baseTotal + taxes + fuelSurcharge + 99 + extrasTotal;

    return {
      baseTotal,
      taxes,
      fuelSurcharge,
      convenienceFee: 99,
      extrasTotal,
      totalAmount,
      passengers,
      baseFare,
    };
  },

  reset: () =>
    set({
      flight: null,
      seatClass: 'economy',
      selectedSeats: [],
      passengers: [],
      contactInfo: {
        email: '',
        phone: '',
        emergencyContact: { name: '', phone: '' },
      },
      extras: {
        extraBaggage: false,
        travelInsurance: false,
        mealUpgrade: false,
        priorityBoarding: false,
      },
      searchParams: { adults: 1, children: 0, infants: 0, tripType: 'one-way' },
      currentStep: 0,
    }),
}));
