require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const cors = require('cors');

const database = require('./config/database');
const setupSocketIO = require('./config/socket');

const apiRoutes = require('./routes');

const GameHandler = require('./handlers/GameHandler');

const app = express();
const httpServer = createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '');
app.use(cors({
  origin: FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use('/api', apiRoutes);

const io = setupSocketIO(httpServer);

const gameHandler = new GameHandler(io);

io.on('connection', (socket) => {
  gameHandler.handleConnection(socket);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function startServer() {
  try {
    await database.connect();
    const PORT = process.env.PORT || 8080;

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`
╔════════════════════════════════════════════════╗
║   Chain Skill Games Backend Server             ║
╠════════════════════════════════════════════════╣
║   Port: ${PORT.toString().padEnd(38)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(32)}║
║   Frontend: ${(FRONTEND_URL || 'all origins').padEnd(35)}║
╚════════════════════════════════════════════════╝

Health: http://localhost:${PORT}/api/health
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing server...');
      httpServer.close(async () => {
        await database.disconnect();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
