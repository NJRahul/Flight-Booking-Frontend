import { useState, useEffect } from 'react';
import useSocket from './useSocket';

const useFlightStatus = ({ flightId, initialStatus = 'scheduled', initialDelay = 0, initialGate = null }) => {
  const [status, setStatus] = useState(initialStatus);
  const [delay, setDelay] = useState(initialDelay);
  const [gate, setGate] = useState(initialGate);
  const [updatedAt, setUpdatedAt] = useState(null);

  const { socket, joinFlightRoom } = useSocket();

  useEffect(() => {
    if (!flightId) return;
    joinFlightRoom(flightId);
  }, [flightId, joinFlightRoom]);

  useEffect(() => {
    if (!socket || !flightId) return;

    const handleUpdate = (data) => {
      if (String(data.flightId) !== String(flightId)) return;
      if (data.status) setStatus(data.status);
      if (data.delay !== undefined) setDelay(data.delay);
      if (data.gate) setGate(data.gate);
      setUpdatedAt(new Date());
    };

    socket.on('flight:update', handleUpdate);
    socket.on('flight:statusUpdate', handleUpdate);
    return () => {
      socket.off('flight:update', handleUpdate);
      socket.off('flight:statusUpdate', handleUpdate);
    };
  }, [socket, flightId]);

  // Sync with prop changes (e.g. initial load from API)
  useEffect(() => { setStatus(initialStatus); }, [initialStatus]);
  useEffect(() => { setDelay(initialDelay); }, [initialDelay]);
  useEffect(() => { setGate(initialGate); }, [initialGate]);

  return {
    status,
    delay,
    gate,
    updatedAt,
    isDelayed: status === 'delayed' || delay > 0,
    isCancelled: status === 'cancelled',
    isBoarding: status === 'boarding',
    isDeparted: status === 'departed',
  };
};

export default useFlightStatus;
