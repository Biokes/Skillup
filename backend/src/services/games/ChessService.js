const BaseGameService = require('../base/BaseGameService');

class ChessService extends BaseGameService {
  constructor() {
    super('chess');
  }

  getInitialGameState() {
    return {
      board: this.getInitialBoard(),
      currentTurn: 'white',
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      check: false,
      checkmate: false,
      stalemate: false,
      halfMoveClock: 0,
      fullMoveNumber: 1
    };
  }

  getInitialBoard() {
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
    return true;
  }
}

module.exports = ChessService;
