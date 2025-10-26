const { Server } = require('socket.io');

function setupSocketIO(httpServer) {
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

  io.engine.on('connection_error', (err) => {
    console.error('Connection error: ', {
      type: err.type,
      description: err.description,
      context: err.context,
      message: err.message
    });
  });

  io.on('error', (error) => {
    console.error('Socket.IO error: ', error);
  });

  console.log('✓ Socket.IO configured');

  return io;
}

module.exports = setupSocketIO;
