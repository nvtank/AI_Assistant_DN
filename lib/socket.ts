import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = () => {
  // Disabled Socket.IO - using Pusher for production
  // Socket.IO requires a separate server which is not available in Vercel serverless
  console.warn('⚠️ Socket.IO is disabled in production. Using Pusher for real-time updates.');
  return null;
};

export const getSocket = () => {
  // Return null - Socket.IO is disabled
  return null;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
