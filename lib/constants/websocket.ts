import { io, Socket } from "socket.io-client";
import { URL_CONNECT } from "../constants";

let socket: Socket | null = null;

/**
 * Khởi tạo WebSocket với token và userId.
 * @param token - Token xác thực của người dùng.
 * @param userId - ID của người dùng.
 * @returns Socket - Đối tượng Socket đã được khởi tạo.
 */
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
    socket?.emit("join", userId); // Tham gia room với userId
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Lỗi kết nối WebSocket:", error);
  });

  socket.on("disconnect", () => {
    console.log("Đã ngắt kết nối WebSocket");
  });

  return socket;
};

/**
 * Lấy đối tượng Socket hiện tại.
 * @returns Socket - Đối tượng Socket hiện tại.
 * @throws Error - Nếu Socket chưa được khởi tạo.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    throw new Error("Socket chưa được khởi tạo!");
  }
  return socket;
};

/**
 * Ngắt kết nối và xóa đối tượng Socket hiện tại.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};