"use client";

import { io as clientIO, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = clientIO(undefined as unknown as string, {
    path: "/api/socket",
  });
  return socket;
}
