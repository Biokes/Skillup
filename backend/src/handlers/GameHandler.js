const RoomService = require('../services/RoomService');
const LeaderboardService = require('../services/LeaderboardService');
const PaymentService = require('../services/PaymentService');
const ConnectionService = require('../services/ConnectionService');
const GameRepository = require('../repositories/GameRepository');

// Game services
const PingPongService = require('../services/games/PingPongService');
const AirHockeyService = require('../services/games/AirHockeyService');
const ChessService = require('../services/games/ChessService');
const PoolService = require('../services/games/PoolService');

class GameHandler {
  constructor(io) {
    this.io = io;
    this.roomService = new RoomService();
    this.leaderboardService = new LeaderboardService();
    this.paymentService = new PaymentService();
    this.connectionService = new ConnectionService(io);
    this.gameRepo = new GameRepository();

    // Initialize game services
    this.gameServices = {
      pingpong: new PingPongService(),
      airhockey: new AirHockeyService(),
      chess: new ChessService(),
      pool: new PoolService()
    };

    this.gameLoops = new Map(); // roomCode -> intervalId
  }

  handleConnection(socket) {
    const { username, walletAddress, deviceId } = socket.handshake.query;

    console.log('New connection:', {
      socketId: socket.id,
      username,
      walletAddress,
      transport: socket.conn.transport.name
    });

    // Register connection
    if (username && walletAddress) {
      this.connectionService.handleConnection(socket, {
        playerName: username,
        walletAddress,
        deviceId
      }).catch(err => console.error('Connection error:', err));
    }

    // ===== ROOM EVENTS =====

    socket.on('createRoom', async (data) => {
      await this.handleCreateRoom(socket, data);
    });

    socket.on('joinRoom', async (data) => {
      await this.handleJoinRoom(socket, data);
    });

    socket.on('leaveRoom', () => {
      this.handleLeaveRoom(socket);
    });

    socket.on('getActiveGames', (data) => {
      const activeGames = this.roomService.getActiveGames(data?.gameType);
      socket.emit('activeGamesList', activeGames);
    });

    // ===== GAME EVENTS =====

    socket.on('paddleMove', (data) => {
      this.handlePaddleMove(socket, data);
    });

    socket.on('strikerMove', (data) => {
      this.handleStrikerMove(socket, data);
    });

    socket.on('chessMove', (data) => {
      this.handleChessMove(socket, data);
    });

    socket.on('poolShoot', (data) => {
      this.handlePoolShoot(socket, data);
    });

    socket.on('pauseGame', () => {
      this.handlePauseGame(socket);
    });

    socket.on('resumeGame', () => {
      this.handleResumeGame(socket);
    });

    socket.on('forfeitGame', () => {
      this.handleForfeitGame(socket);
    });

    // ===== PAYMENT EVENTS =====

    socket.on('createStakedGame', async (data) => {
      await this.handleCreateStakedGame(socket, data);
    });

    socket.on('player2StakeCompleted', async (data) => {
      await this.handlePlayer2StakeCompleted(socket, data);
    });

    // ===== LEADERBOARD EVENTS =====

    socket.on('getLeaderboard', async (data) => {
      const { gameType, limit } = data;
      const leaderboard = await this.leaderboardService.getGameLeaderboard(gameType, limit || 10);
      socket.emit('leaderboardUpdate', { gameType, leaderboard });
    });

    // ===== DISCONNECT =====

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  async handleCreateRoom(socket, data) {
    const { gameType, player, roomCode } = data;

    try {
      const room = this.roomService.createRoom(gameType, player, socket.id, roomCode);
      socket.join(room.code);

      socket.emit('roomCreated', { roomCode: room.code, room });
      console.log(`Room created: ${room.code} (${gameType})`);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  async handleJoinRoom(socket, data) {
    const { roomCode, player } = data;

    try {
      const result = this.roomService.joinRoom(roomCode, player, socket.id);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(roomCode);

      // Check if this is a staked match
      const gameRecord = await this.gameRepo.findByRoomCode(roomCode);

      if (gameRecord?.isStaked && !gameRecord.player2TxHash) {
        // Waiting for player 2 to stake
        socket.emit('stakedMatchJoined', {
          roomCode,
          stakeAmount: gameRecord.stakeAmount,
          player1Address: gameRecord.player1Address
        });
        return;
      }

      // Start game
      this.io.to(roomCode).emit('roomReady', { room: result.room });
      this.startGame(roomCode, result.room.gameType);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  handleLeaveRoom(socket) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const roomCode = room.code;
    socket.leave(roomCode);

    this.io.to(roomCode).emit('opponentLeft');
    this.endGame(roomCode, room.gameType);
    this.roomService.removePlayerFromRoom(socket.id);
  }

  startGame(roomCode, gameType) {
    const room = this.roomService.getRoom(roomCode);
    if (!room || !room.guest) return;

    this.roomService.startGame(roomCode);

    const gameService = this.gameServices[gameType];
    const gameState = gameService.createGame(roomCode, room.host, room.guest);

    this.io.to(roomCode).emit('gameStart', gameState);

    // Start game loop
    this.startGameLoop(roomCode, gameType);
  }

  startGameLoop(roomCode, gameType) {
    if (this.gameLoops.has(roomCode)) {
      clearInterval(this.gameLoops.get(roomCode));
    }

    const gameService = this.gameServices[gameType];

    const interval = setInterval(() => {
      const result = gameService.updateGameState(roomCode);

      if (!result) {
        clearInterval(interval);
        this.gameLoops.delete(roomCode);
        return;
      }

      const gameOverCheck = gameService.checkGameOver(result);

      if (gameOverCheck.gameOver) {
        this.handleGameOver(roomCode, gameType, gameOverCheck);
        clearInterval(interval);
        this.gameLoops.delete(roomCode);
        return;
      }

      this.io.to(roomCode).emit('gameUpdate', result);
    }, 1000 / 60); // 60 FPS

    this.gameLoops.set(roomCode, interval);
  }

  async handleGameOver(roomCode, gameType, gameOverData) {
    const { winner, isDraw } = gameOverData;
    const gameService = this.gameServices[gameType];
    const game = gameService.getGame(roomCode);

    if (!game) return;

    const loser = game.players.find(p => p.socketId !== winner?.socketId);

    // Update ratings
    let ratingResult = null;
    if (winner && loser) {
      ratingResult = await this.leaderboardService.processGameResult({
        gameType,
        player1: game.players[0],
        player2: game.players[1],
        winner: game.players[0].socketId === winner.socketId ? 'player1' : 'player2',
        isDraw
      });
    }

    // Save game record
    await this.saveGameResult(roomCode, gameType, game, winner, isDraw);

    // Emit game over
    this.io.to(roomCode).emit('gameOver', {
      winner: winner?.socketId,
      winnerName: winner?.name,
      isDraw,
      ratings: ratingResult,
      stats: {
        duration: Date.now() - game.startTime,
        score: game.score
      }
    });

    // Update leaderboard
    const leaderboard = await this.leaderboardService.getGameLeaderboard(gameType, 10);
    this.io.emit('leaderboardUpdate', { gameType, leaderboard });

    this.endGame(roomCode, gameType);
  }

  async saveGameResult(roomCode, gameType, game, winner, isDraw) {
    try {
      const existingGame = await this.gameRepo.findByRoomCode(roomCode);
      const winnerRole = game.players[0].socketId === winner?.socketId ? 'player1' : 'player2';

      if (existingGame) {
        // Update existing (staked) game
        await this.paymentService.finalizeGame(
          roomCode,
          isDraw ? null : winnerRole,
          game.score
        );
      } else {
        // Create new casual game record
        await this.gameRepo.create({
          roomCode,
          gameType,
          player1: {
            name: game.players[0].name,
            rating: game.players[0].rating
          },
          player2: {
            name: game.players[1].name,
            rating: game.players[1].rating
          },
          winner: isDraw ? null : winnerRole,
          score: game.score,
          status: 'finished',
          endedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  }

  handlePaddleMove(socket, { position }) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameService = this.gameServices[room.gameType];
    const updatedGame = gameService.updatePaddle?.(room.code, socket.id, position);

    if (updatedGame) {
      this.io.to(room.code).emit('gameUpdate', updatedGame);
    }
  }

  handleStrikerMove(socket, { position }) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameService = this.gameServices[room.gameType];
    const updatedGame = gameService.updateStriker?.(room.code, socket.id, position);

    if (updatedGame) {
      this.io.to(room.code).emit('gameUpdate', updatedGame);
    }
  }

  handleChessMove(socket, moveData) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameService = this.gameServices.chess;
    const result = gameService.makeMove?.(room.code, socket.id, moveData);

    if (result.success) {
      this.io.to(room.code).emit('gameUpdate', result.game);
    } else {
      socket.emit('error', { message: result.error });
    }
  }

  handlePoolShoot(socket, { angle, power }) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameService = this.gameServices.pool;
    const result = gameService.shoot?.(room.code, socket.id, angle, power);

    if (result.success) {
      this.io.to(room.code).emit('gameUpdate', result.game);
    } else {
      socket.emit('error', { message: result.error });
    }
  }

  handlePauseGame(socket) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameService = this.gameServices[room.gameType];
    const result = gameService.pauseGame(room.code, socket.id);

    if (result.success) {
      this.io.to(room.code).emit('gamePaused', { pausesRemaining: result.pausesRemaining });
    }
  }

  handleResumeGame(socket) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameService = this.gameServices[room.gameType];
    gameService.resumeGame(room.code);

    this.io.to(room.code).emit('gameResumed');
  }

  handleForfeitGame(socket) {
    const room = this.roomService.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameService = this.gameServices[room.gameType];
    const game = gameService.getGame(room.code);
    if (!game) return;

    const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
    const winner = game.players[1 - playerIndex];

    this.io.to(room.code).emit('playerForfeited', {
      forfeitedPlayer: game.players[playerIndex].name,
      winner: winner.name
    });

    this.handleGameOver(room.code, room.gameType, { gameOver: true, winner, isDraw: false });
  }

  async handleCreateStakedGame(socket, data) {
    try {
      const game = await this.paymentService.createStakedGame(data);
      this.roomService.setRoomStaked(data.roomCode, true);

      socket.emit('stakedGameCreated', { game });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  async handlePlayer2StakeCompleted(socket, data) {
    try {
      await this.paymentService.completePlayer2Stake(data.roomCode, data);

      const room = this.roomService.getRoom(data.roomCode);
      if (room) {
        this.io.to(data.roomCode).emit('roomReady', { room });
        this.startGame(data.roomCode, room.gameType);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  handleDisconnect(socket) {
    console.log('Client disconnected:', socket.id);

    this.connectionService.handleDisconnection(socket.id);
    this.handleLeaveRoom(socket);
  }

  endGame(roomCode, gameType) {
    if (this.gameLoops.has(roomCode)) {
      clearInterval(this.gameLoops.get(roomCode));
      this.gameLoops.delete(roomCode);
    }

    const gameService = this.gameServices[gameType];
    gameService.endGame(roomCode);
    this.roomService.endGame(roomCode);
  }
}

module.exports = GameHandler;
