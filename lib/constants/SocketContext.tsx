import { useAuth } from "@/context/AuthContext";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { URL_CONNECT } from ".";


interface SocketContextType {
  socket: Socket | null;
  hasNewNotification: boolean;
  setHasNewNotification: (value: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hasNewNotification, setHasNewNotification] = useState<boolean>(false);

  useEffect(() => {
    if (!user || !token) return;

    // Kết nối đến WebSocket server
    const socketInstance = io(URL_CONNECT, {
      auth: { token },
    });

    setSocket(socketInstance);

    // Tham gia room dựa trên userId
    socketInstance.emit("join", user.id);

    // Lắng nghe thông báo mới
    socketInstance.on("newNotification", () => {
      setHasNewNotification(true);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, hasNewNotification, setHasNewNotification }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};