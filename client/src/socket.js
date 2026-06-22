import { io } from 'socket.io-client';
import { getToken } from './api';

const API_BASE = import.meta.env.VITE_API_URL || '';

let socket = null;

export function connectSocket() {
  if (socket) return socket;
  const token = getToken();
  if (!token) return null;

  socket = io(API_BASE || undefined, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

// Subscribe to a socket event; returns an unsubscribe function. Safe to call
// before the socket connects — it'll attach once connectSocket() runs.
export function onSocketEvent(event, handler) {
  const s = socket || connectSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
}
