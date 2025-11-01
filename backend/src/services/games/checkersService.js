const BaseGameService = require('../base/BaseGameService');

class CheckersService extends BaseGameService {
  constructor() {
    super('checkers');
  }

  getInitialGameState() {
    return {
      board: this.createInitialBoard(),
      currentPlayer: 'red', // Player 1 is always red
      moveHistory: [],
      capturedPieces: { red: [], black: [] },
      selectedPiece: null,
      scores: { red: 12, black: 12 },
      mustContinueJump: false,
      jumpingPiece: null
    };
  }

  createInitialBoard() {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));

    // Place black pieces (top 3 rows) - Player 2
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = 'black';
        }
      }
    }

    // Place red pieces (bottom 3 rows) - Player 1
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          board[row][col] = 'red';
        }
      }
    }

    return board;
  }

  updateGameState(roomCode) {
    const game = this.activeGames.get(roomCode);
    if (!game || game.isPaused) return null;
    // Checkers is turn-based, no continuous updates needed
    return game;
  }

  makeMove(roomCode, socketId, moveData) {
    const game = this.activeGames.get(roomCode);
    if (!game) return { success: false, error: 'Game not found' };

    const playerIndex = game.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) {
      return { success: false, error: 'Player not in game' };
    }

    const playerColor = playerIndex === 0 ? 'red' : 'black';

    // Check if it's player's turn
    if (game.currentPlayer !== playerColor) {
      return { success: false, error: 'Not your turn' };
    }

    const { from, to } = moveData;

    // Validate positions
    if (!this.isValidPosition(from.row, from.col) || !this.isValidPosition(to.row, to.col)) {
      return { success: false, error: 'Invalid position' };
    }

    const piece = game.board[from.row][from.col];

    // Validate piece ownership
    if (!piece || !piece.includes(playerColor)) {
      return { success: false, error: 'Invalid piece' };
    }

    // If must continue jump, validate it's the same piece
    if (game.mustContinueJump && game.jumpingPiece) {
      if (from.row !== game.jumpingPiece.row || from.col !== game.jumpingPiece.col) {
        return { success: false, error: 'Must continue jumping with the same piece' };
      }
    }

    // Get valid moves for this piece
    const validMoves = this.getValidMoves(game.board, from.row, from.col, piece, playerColor);
    const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);

    if (!isValid) {
      return { success: false, error: 'Invalid move' };
    }

    // Check for mandatory jumps
    const allJumps = this.getAllAvailableJumps(game.board, playerColor);
    const rowDiff = Math.abs(to.row - from.row);
    const isJump = rowDiff === 2;

    // If jumps are available and this isn't a jump, it's invalid
    if (allJumps.length > 0 && !isJump && !game.mustContinueJump) {
      return { success: false, error: 'You must take the available jump' };
    }

    // Execute move
    let movingPiece = piece;
    game.board[to.row][to.col] = movingPiece;
    game.board[from.row][from.col] = null;

    // Handle capture
    let capturedPiece = null;
    if (isJump) {
      const captureRow = Math.floor((from.row + to.row) / 2);
      const captureCol = Math.floor((from.col + to.col) / 2);
      capturedPiece = game.board[captureRow][captureCol];
      game.board[captureRow][captureCol] = null;

      if (capturedPiece) {
        game.capturedPieces[playerColor].push(capturedPiece);
      }
    }

    // Promote to king if reached opposite end
    if (movingPiece === 'red' && to.row === 0) {
      game.board[to.row][to.col] = 'red-king';
      movingPiece = 'red-king';
    } else if (movingPiece === 'black' && to.row === 7) {
      game.board[to.row][to.col] = 'black-king';
      movingPiece = 'black-king';
    }

    // Record move
    game.moveHistory.push({
      from,
      to,
      piece: movingPiece,
      captured: capturedPiece,
      timestamp: Date.now()
    });

    // Update piece counts
    game.scores.red = this.countPieces(game.board, 'red');
    game.scores.black = this.countPieces(game.board, 'black');

    // Check for additional jumps after a capture
    if (isJump) {
      const additionalJumps = this.getValidMoves(game.board, to.row, to.col, movingPiece, playerColor)
        .filter(move => Math.abs(move.row - to.row) === 2);

      if (additionalJumps.length > 0) {
        // Must continue jumping
        game.mustContinueJump = true;
        game.jumpingPiece = { row: to.row, col: to.col };
        game.selectedPiece = { row: to.row, col: to.col };

        return {
          success: true,
          game,
          continueJump: true,
          message: 'Continue jumping with the same piece'
        };
      }
    }

    // Reset jump continuation flags
    game.mustContinueJump = false;
    game.jumpingPiece = null;
    game.selectedPiece = null;

    // Switch turn only if no more jumps
    game.currentPlayer = game.currentPlayer === 'red' ? 'black' : 'red';

    return { success: true, game };
  }

  getValidMoves(board, row, col, piece, playerColor) {
    const moves = [];
    const isKing = piece.includes('king');
    const isRed = piece.includes('red');

    // Direction: kings move all 4 diagonals, regular pieces only forward
    const directions = isKing
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : isRed
        ? [[-1, -1], [-1, 1]]  // Red moves up (negative row)
        : [[1, -1], [1, 1]];   // Black moves down (positive row)

    directions.forEach(([dRow, dCol]) => {
      // Regular move (1 square)
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (this.isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
        moves.push({ row: newRow, col: newCol, isJump: false });
      }

      // Jump move (2 squares)
      const jumpRow = row + dRow * 2;
      const jumpCol = col + dCol * 2;
      const captureRow = row + dRow;
      const captureCol = col + dCol;

      if (this.isValidPosition(jumpRow, jumpCol) &&
          !board[jumpRow][jumpCol] &&
          board[captureRow][captureCol] &&
          !board[captureRow][captureCol].includes(playerColor)) {
        moves.push({ row: jumpRow, col: jumpCol, isJump: true });
      }
    });

    return moves;
  }

  getAllAvailableJumps(board, playerColor) {
    const jumps = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.includes(playerColor)) {
          const moves = this.getValidMoves(board, row, col, piece, playerColor);
          const jumpMoves = moves.filter(m => m.isJump);

          if (jumpMoves.length > 0) {
            jumps.push({ from: { row, col }, moves: jumpMoves });
          }
        }
      }
    }

    return jumps;
  }

  countPieces(board, color) {
    let count = 0;
    board.forEach(row => {
      row.forEach(cell => {
        if (cell && cell.includes(color)) {
          count++;
        }
      });
    });
    return count;
  }

  hasLegalMoves(board, playerColor) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.includes(playerColor)) {
          const moves = this.getValidMoves(board, row, col, piece, playerColor);
          if (moves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  checkGameOver(gameState) {
    const redCount = gameState.scores.red;
    const blackCount = gameState.scores.black;

    // Check if either player has no pieces
    if (redCount === 0) {
      return {
        gameOver: true,
        winner: gameState.players[1],  // Black (Player 2) wins
        isDraw: false
      };
    }

    if (blackCount === 0) {
      return {
        gameOver: true,
        winner: gameState.players[0],  // Red (Player 1) wins
        isDraw: false
      };
    }

    // Check if current player has no legal moves (blocked/stalemate)
    const currentPlayerColor = gameState.currentPlayer;
    if (!this.hasLegalMoves(gameState.board, currentPlayerColor)) {
      const winnerIndex = currentPlayerColor === 'red' ? 1 : 0;
      return {
        gameOver: true,
        winner: gameState.players[winnerIndex],
        isDraw: false
      };
    }

    return { gameOver: false };
  }

  validateMove(gameState, socketId, moveData) {
    // Additional validation can be added here if needed
    return true;
  }
}

module.exports = CheckersService;
