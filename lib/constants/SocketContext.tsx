import { useAuth } from "@/context/AuthContext";
import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { URL_CONNECT } from ".";

interface SocketContextType {
  socket: Socket | null;
  hasNewProductNotification: boolean;
  setHasNewProductNotification: (value: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hasNewProductNotification, setHasNewProductNotification] = useState<boolean>(false);

  useEffect(() => {
    if (!user || !token) return;

    // Kết nối đến WebSocket server
    const socketInstance = io(URL_CONNECT, {
      auth: { token },
      query: { userId: user.id },
    });

    setSocket(socketInstance);

    // Lắng nghe thông báo về sản phẩm bị gỡ
    socketInstance.on("productRemovedByAdmin", (data) => {
      console.log("Nhận thông báo sản phẩm bị gỡ:", data);
      setHasNewProductNotification(true);
      
      // Hiển thị thông báo cho người dùng
      // Alert.alert(
      //   "Sản phẩm bị gỡ", 
      //   data.message, 
      //   [{ text: "OK", onPress: () => setHasNewProductNotification(false) }]
      // );
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      hasNewProductNotification, 
      setHasNewProductNotification 
    }}>
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