'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const retriesRef = useRef(0);
  const maxRetries = 10;

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

    function connect() {
      const s = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
        randomizationFactor: 0.5,
        timeout: 20000,
      });

      s.on('connect', () => {
        setIsConnected(true);
        retriesRef.current = 0;
      });

      s.on('disconnect', () => setIsConnected(false));

      s.on('connect_error', () => {
        retriesRef.current++;
        if (retriesRef.current >= maxRetries) {
          s.disconnect();
        }
      });

      s.on('pong', () => {
        // heartbeat received
      });

      setSocket(s);

      // Heartbeat interval
      const heartbeat = setInterval(() => {
        if (s.connected) s.emit('ping');
      }, 25000);

      return () => {
        clearInterval(heartbeat);
        s.disconnect();
      };
    }

    const cleanup = connect();
    return () => { if (cleanup) cleanup(); };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
