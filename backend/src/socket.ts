import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import pino from "pino";
import jwt from "jsonwebtoken";

const logger = pino({ transport: { target: "pino-pretty" } });

export const setupSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("join_request_room", (requestId: string) => {
      socket.join(`request_${requestId}`);
      logger.info(`Socket ${socket.id} joined room request_${requestId}`);
    });

    socket.on("send_message", (data: { requestId: string; text: string; senderRole: string }) => {
      const { requestId, text, senderRole } = data;
      const user = (socket as any).user;
      
      // In a real app, you would also save the message to DB here
      // But since we have a POST /api/chat route, the client might call the REST API to save,
      // and use socket.io just to broadcast, OR we save it here.
      // For now, let's just broadcast it to the room.
      io.to(`request_${requestId}`).emit("receive_message", {
        requestId,
        text,
        senderRole,
        senderId: user.userId,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
