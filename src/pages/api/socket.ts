import type { NextApiRequest } from "next";
import type { NextApiResponseServerIO } from "@/types/next";
import { Server as IOServer } from "socket.io";

export const config = {
  api: { bodyParser: false },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket) {
    res.status(500).end();
    return;
  }

  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: { origin: "*" },
    });
    res.socket.server.io = io;
    global.io = io;
    io.on("connection", (socket) => {
      socket.on("join", (room: string) => socket.join(room));
    });
  }
  res.end();
}
