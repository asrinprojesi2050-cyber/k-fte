import { createServer } from "http";
import pino from "pino";
import app from "./app";
import { setupSocket } from "./socket";

const logger = pino({ transport: { target: "pino-pretty" } });

const port = Number(process.env.PORT ?? 3000);

const httpServer = createServer(app);

// Initialize Socket.IO
setupSocket(httpServer);

httpServer.listen(port, () => {
  logger.info(`Köfte API listening on http://localhost:${port}`);
});
