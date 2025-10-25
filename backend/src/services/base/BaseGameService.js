/**
 * Base Game Service
 * Abstract class that provides common functionality for all game types
 * Each specific game (PingPong, AirHockey, etc.) extends this class
 */

const { calculateRatingChanges } = require('../../utils/eloCalculator');

class BaseGameService {
  constructor(gameType) {
    if (this.constructor === BaseGameService) {
      throw new Error('BaseGameService is an abstract class and cannot be instantiated directly');
    }

    this.gameType = gameType;
    this.activeGames = new Map(); // roomCode -> gameState
  }

  /**
   * Create a new game instance
   * @param {string} roomCode - Unique room identifier
   * @param {object} player1 - First player data
   * @param {object} player2 - Second player data
   * @returns {object} Initial game state
   */
  createGame(roomCode, player1, player2) {
    const gameState = {
      id: roomCode,
      roomCode,
      gameType: this.gameType,
      players: [
        { ...player1, index: 0, socketId: player1.socketId },
        { ...player2, index: 1, socketId: player2.socketId }
      ],
      status: 'active',
      startTime: Date.now(),
      pauseCount: 0,
      isPaused: false,
      ...this.getInitialGameState()
    };

    this.activeGames.set(roomCode, gameState);
    return gameState;
  }

  /**
   * Get initial game-specific state
   * Must be implemented by child classes
   * @returns {object} Game-specific initial state
   */
  getInitialGameState() {
    throw new Error('getInitialGameState() must be implemented by child class');
  }

  /**
   * Update game state (called on each game loop iteration)
   * Must be implemented by child classes
   * @param {string} roomCode - Room identifier
   * @returns {object|null} Updated game state or null if game not found
   */
  updateGameState(roomCode) {
    throw new Error('updateGameState() must be implemented by child class');
  }

  /**
   * Check if game is over
   * Must be implemented by child classes
   * @param {object} gameState - Current game state
   * @returns {object|null} { gameOver: boolean, winner: object, isDraw: boolean }
   */
  checkGameOver(gameState) {
    throw new Error('checkGameOver() must be implemented by child class');
  }

  /**
   * Get game by room code
   * @param {string} roomCode
   * @returns {object|null} Game state or null
   */
  getGame(roomCode) {
    return this.activeGames.get(roomCode) || null;
  }

  /**
   * Get game by player socket ID
   * @param {string} socketId
   * @returns {object|null} Game state or null
   */
  getGameByPlayer(socketId) {
    for (const game of this.activeGames.values()) {
      if (game.players.some(p => p.socketId === socketId)) {
        return game;
      }
    }
    return null;
  }

  /**
   * Pause game
   * @param {string} roomCode
   * @param {string} socketId - Player requesting pause
   * @returns {object} { success: boolean, message?: string, pausesRemaining?: number }
   */
  pauseGame(roomCode, socketId) {
    const game = this.activeGames.get(roomCode);
    if (!game) {
      return { success: false, message: 'Game not found' };
    }

    if (game.isPaused) {
      return { success: false, message: 'Game is already paused' };
    }

    const MAX_PAUSES = 3;
    if (game.pauseCount >= MAX_PAUSES) {
      return { success: false, message: 'Maximum pauses reached' };
    }

    game.isPaused = true;
    game.pauseCount += 1;

    return {
      success: true,
      pausesRemaining: MAX_PAUSES - game.pauseCount
    };
  }

  /**
   * Resume game
   * @param {string} roomCode
   * @returns {boolean} Success
   */
  resumeGame(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (!game) return false;

    game.isPaused = false;
    return true;
  }

  /**
   * End game and clean up
   * @param {string} roomCode
   * @returns {boolean} Success
   */
  endGame(roomCode) {
    return this.activeGames.delete(roomCode);
  }

  /**
   * Calculate rating changes after game completion
   * @param {object} winner - Winner player data
   * @param {object} loser - Loser player data
   * @param {boolean} isDraw - Whether game was a draw
   * @returns {object} { winnerNewRating, loserNewRating }
   */
  calculateRatings(winner, loser, isDraw = false) {
    return calculateRatingChanges(winner.rating, loser.rating, isDraw);
  }

  /**
   * Validate player move
   * Can be overridden by child classes for game-specific validation
   * @param {object} gameState
   * @param {string} socketId
   * @param {object} moveData
   * @returns {boolean} Is move valid
   */
  validateMove(gameState, socketId, moveData) {
    return true; // Default: all moves are valid
  }
}

module.exports = BaseGameService;
