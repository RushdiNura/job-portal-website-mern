import { io } from "socket.io-client";

let socketInstance = null;

// Lazily creates a single authenticated Socket.IO connection, reusing it across
// components. The JWT is passed via the handshake auth payload (never in the
// URL), matching the server's socket auth middleware.
export const getSocket = () => {
  const token = localStorage.getItem("jobnest_token");
  if (!token) return null;

  if (!socketInstance) {
    const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/api\/?$/, "");
    socketInstance = io(base || undefined, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
