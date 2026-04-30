/**
 * SocketContext.jsx
 * Provides a real-time Socket.io connection scoped to the logged-in user.
 * Any component can subscribe to incoming "notification" events.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001";

export function SocketProvider({ children }) {
  const { user, token } = useContext(AuthContext);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  // Listeners registered by child components
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!user || !token) {
      // Clean up if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Connect with auth handshake
    const socket = io(SOCKET_URL, {
      auth: { userId: user.id || user._id },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setConnected(false);
    });

    // Forward notification events to all registered listeners
    socket.on("notification", (notif) => {
      listenersRef.current.forEach((cb) => cb(notif));
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user?.id, token]);

  /**
   * Subscribe to real-time notifications.
   * Returns an unsubscribe function.
   */
  const onNotification = (callback) => {
    listenersRef.current.push(callback);
    return () => {
      listenersRef.current = listenersRef.current.filter((cb) => cb !== callback);
    };
  };

  return (
    <SocketContext.Provider value={{ connected, onNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
