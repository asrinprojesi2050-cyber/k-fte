import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import pino from "pino";
import jwt from "jsonwebtoken";

const logger = pino({ transport: { target: "pino-pretty" } });

let ioInstance: Server | null = null;

export const setupSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });
  ioInstance = io;

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
    const user = (socket as any).user;
    logger.info(`Socket connected: ${socket.id} (User: ${user?.id || user?.userId})`);

    // Auto-join user room for personal notifications
    const userId = user.id || user.userId;
    if (userId) {
      socket.join(`user_${userId}`);
      logger.info(`Socket ${socket.id} joined personal room user_${userId}`);
    }

    socket.on("join_request_room", (requestId: string) => {
      socket.join(`request_${requestId}`);
      logger.info(`Socket ${socket.id} joined room request_${requestId}`);
    });

    socket.on("leave_request_room", (requestId: string) => {
      socket.leave(`request_${requestId}`);
      logger.info(`Socket ${socket.id} left room request_${requestId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized!");
  }
  return ioInstance;
};
