import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    socketRef.current = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('connect_error', () => setIsConnected(false));

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinFlightRoom = useCallback((flightId) => {
    socketRef.current?.emit('join:flight', flightId);
  }, []);

  const joinBookingRoom = useCallback((bookingId) => {
    socketRef.current?.emit('join:booking', bookingId);
  }, []);

  const joinUserRoom = useCallback((userId) => {
    socketRef.current?.emit('join:user', userId);
  }, []);

  const leaveRoom = useCallback((room) => {
    socketRef.current?.emit('leave', room);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinFlightRoom,
    joinBookingRoom,
    joinUserRoom,
    leaveRoom,
  };
};

export default useSocket;
