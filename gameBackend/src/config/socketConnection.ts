import { Server } from "socket.io";
import { Server as HttpServer } from "http";

function setupSocketIO(httpServer: HttpServer) {
  const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '');

  const io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL || '*',
      methods: ['GET', 'POST', 'PATCH'],
      credentials: true,
      allowedHeaders: ['*']
    },
    allowEIO3: true,
    transports: ['websocket'],
    path: '/socket.io/',
    connectTimeout: 45000,
    pingInterval: 10000,
    pingTimeout: 5000,
    cookie: false,
    allowUpgrades: false,
    perMessageDeflate: false
  });

  io.engine.on('connection_error', (err: unknown) => {
    console.error('Socket.IO error: ', err instanceof Error? `error message : ${err.message}`: err );
  });

  io.on('error', (error: unknown) => {
    console.error('Socket.IO error: ', error instanceof Error? `error message : ${error.message}`: error );
  });

  console.log('✓ Socket.IO configured');
  return io;
}

module.exports = setupSocketIO;
