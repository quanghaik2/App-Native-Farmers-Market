import { io, Socket } from "socket.io-client";
import { URL_CONNECT } from "../constants";

let socket: Socket | null = null;

export const initializeSocket = (token: string, userId: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(URL_CONNECT, {
    auth: { token },
    query: { userId },
  });

  socket.on("connect", () => {
    console.log("Đã kết nối WebSocket với userId:", userId);
    socket?.emit("join", userId);
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Lỗi kết nối WebSocket:", error);
  });

  socket.on("disconnect", () => {
    console.log("Đã ngắt kết nối WebSocket");
  });

  // Lắng nghe sự kiện sản phẩm bị gỡ
  socket.on("productRemovedByAdmin", (data) => {
    console.log("Nhận thông báo sản phẩm bị gỡ:", data);
  });

  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    throw new Error("Socket chưa được khởi tạo!");
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Hàm mới để gửi thông báo sản phẩm bị gỡ
export const notifyProductRemoved = (userId: string, productName: string, reason: string) => {
  if (socket) {
    socket.emit("productRemovedByAdmin", {
      userId,
      message: `Sản phẩm "${productName}" của bạn đã bị gỡ bởi quản trị viên. Lý do: ${reason}`
    });
  }
};