import { useState, useEffect } from 'react';
import useSocket from './useSocket';

const useBookingStatus = (bookingId) => {
  const [bookingStatus, setBookingStatus] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [flightUpdate, setFlightUpdate] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { socket, joinBookingRoom } = useSocket();

  useEffect(() => {
    if (!bookingId) return;
    joinBookingRoom(bookingId);
  }, [bookingId, joinBookingRoom]);

  useEffect(() => {
    if (!socket || !bookingId) return;

    const handleBookingUpdate = (data) => {
      if (data.status) setBookingStatus(data.status);
      if (data.paymentStatus) setPaymentStatus(data.paymentStatus);
      setLastUpdated(new Date());
    };

    const handleFlightUpdate = (data) => {
      setFlightUpdate(data);
      setLastUpdated(new Date());
    };

    socket.on('booking:update', handleBookingUpdate);
    socket.on('booking:flight_update', handleFlightUpdate);
    return () => {
      socket.off('booking:update', handleBookingUpdate);
      socket.off('booking:flight_update', handleFlightUpdate);
    };
  }, [socket, bookingId]);

  return { bookingStatus, paymentStatus, flightUpdate, lastUpdated };
};

export default useBookingStatus;
