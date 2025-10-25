const BaseGameService = require('../base/BaseGameService');

/**
 * Chess Service
 * Note: This is a placeholder. Full chess implementation requires:
 * - Move validation
 * - Check/checkmate detection
 * - Castling, en passant, promotion rules
 * - Consider using chess.js library for full implementation
 */
class ChessService extends BaseGameService {
  constructor() {
    super('chess');
  }

  getInitialGameState() {
    return {
      board: this.getInitialBoard(),
      currentTurn: 'white', // 'white' or 'black'
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      check: false,
      checkmate: false,
      stalemate: false,
      halfMoveClock: 0, // For fifty-move rule
      fullMoveNumber: 1
    };
  }

  getInitialBoard() {
    // Standard chess starting position
    // TODO: Implement full board state or integrate chess.js
    return [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
  }

  updateGameState(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (!game || game.isPaused) return null;

    // Chess doesn't have continuous updates like pong
    // State only changes on moves
    return game;
  }

  makeMove(roomCode, socketId, moveData) {
    const game = this.activeGames.get(roomCode);
    if (!game) return { success: false, error: 'Game not found' };

    const playerIndex = game.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return { success: false, error: 'Player not in game' };

    const playerColor = playerIndex === 0 ? 'white' : 'black';

    if (game.currentTurn !== playerColor) {
      return { success: false, error: 'Not your turn' };
    }

    // TODO: Implement full move validation
    // For now, accept all moves
    const { from, to, promotion } = moveData;

    game.moveHistory.push({ from, to, promotion, turn: game.fullMoveNumber });
    game.currentTurn = game.currentTurn === 'white' ? 'black' : 'white';
    game.fullMoveNumber++;

    return { success: true, game };
  }

  checkGameOver(gameState) {
    if (gameState.checkmate) {
      const loserColor = gameState.currentTurn;
      const winnerIndex = loserColor === 'white' ? 1 : 0;

      return {
        gameOver: true,
        winner: gameState.players[winnerIndex],
        isDraw: false
      };
    }

    if (gameState.stalemate || gameState.halfMoveClock >= 100) {
      return {
        gameOver: true,
        winner: null,
        isDraw: true
      };
    }

    return { gameOver: false };
  }

  validateMove(gameState, socketId, moveData) {
    // TODO: Implement chess move validation
    // Consider using chess.js library
    return true;
  }
}

module.exports = ChessService;
