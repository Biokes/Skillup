const { calculateRatingChanges } = require('../../utils/eloCalculator');

class BaseGameService {
  constructor(gameType) {
    if (this.constructor === BaseGameService) {
      throw new Error('BaseGameService is an abstract class and cannot be instantiated directly');
    }

    this.gameType = gameType;
    this.activeGames = new Map();
  }

  createGame(roomCode, player1, player2) {
    const gameState = {
      id: roomCode,
      roomCode,
      gameType: this.gameType,
      players: [
        { ...player1, index: 0, socketId: player1.socketId, pausesUsed: 0 },
        { ...player2, index: 1, socketId: player2.socketId, pausesUsed: 0 }
      ],
      status: 'active',
      startTime: Date.now(),
      pauseCount: 0,
      isPaused: false,
      pauseTimerId: null,
      ...this.getInitialGameState()
    };

    this.activeGames.set(roomCode, gameState);
    return gameState;
  }

  getInitialGameState() {
    throw new Error('getInitialGameState() must be implemented by child class');
  }

  updateGameState(roomCode) {
    throw new Error('updateGameState() must be implemented by child class');
  }

  checkGameOver(gameState) {
    throw new Error('checkGameOver() must be implemented by child class');
  }

  getGame(roomCode) {
    return this.activeGames.get(roomCode) || null;
  }

  getGameByPlayer(socketId) {
    for (const game of this.activeGames.values()) {
      if (game.players.some(p => p.socketId === socketId)) {
        return game;
      }
    }
    return null;
  }

  pauseGame(roomCode, socketId, resumeCallback) {
    const game = this.activeGames.get(roomCode);
    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    if (game.isPaused) {
      return { success: false, message: 'Game is already paused' };
    }

    const player = game.players.find(p => p.socketId === socketId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Check player's pause limit (2 per player)
    const MAX_PAUSES_PER_PLAYER = 2;
    if (player.pausesUsed >= MAX_PAUSES_PER_PLAYER) {
      return { success: false, message: 'You have no pauses remaining' };
    }

    game.isPaused = true;
    player.pausesUsed += 1;
    game.pauseCount += 1;

    if (game.pauseTimerId) {
      clearTimeout(game.pauseTimerId);
    }

    game.pauseTimerId = setTimeout(() => {
      if (game.isPaused) {
        game.isPaused = false;
        game.pauseTimerId = null;
        if (resumeCallback) {
          resumeCallback(roomCode);
        }
      }
    }, 10000);

    return {
      success: true,
      pausesRemaining: MAX_PAUSES_PER_PLAYER - player.pausesUsed,
      playerName: player.name
    };
  }

  resumeGame(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (!game) return false;

    if (game.pauseTimerId) {
      clearTimeout(game.pauseTimerId);
      game.pauseTimerId = null;
    }

    game.isPaused = false;
    return true;
  }

  endGame(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (game && game.pauseTimerId) {
      clearTimeout(game.pauseTimerId);
    }
    return this.activeGames.delete(roomCode);
  }

  calculateRatings(winner, loser, isDraw = false) {
    return calculateRatingChanges(winner.rating, loser.rating, isDraw);
  }

  validateMove(gameState, socketId, moveData) {
    return true;
  }
}

module.exports = BaseGameService;
