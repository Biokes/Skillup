import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, User } from "lucide-react";
import { toast } from "sonner";

type PieceType = "red" | "black" | "red-king" | "black-king" | null;
type Player = "red" | "black";

interface Position {
  row: number;
  col: number;
}

interface GameState {
  board: PieceType[][];
  currentPlayer: Player;
  selectedPiece: Position | null;
  validMoves: Position[];
  winner: Player | "draw" | null;
  scores: { red: number; black: number };
}

const BOARD_SIZE = 8;

const createInitialBoard = (): PieceType[][] => {
  const board: PieceType[][] = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
  
  // Place black pieces (top)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = "black";
      }
    }
  }
  
  // Place red pieces (bottom)
  for (let row = 5; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = "red";
      }
    }
  }
  
  return board;
};

export const CheckersBoard = ({ onBack }: { onBack: () => void }) => {
  const [gameState, setGameState] = useState<GameState>({
    board: createInitialBoard(),
    currentPlayer: "red",
    selectedPiece: null,
    validMoves: [],
    winner: null,
    scores: { red: 12, black: 12 },
  });

  const isValidPosition = (row: number, col: number) => {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  };

  const getValidMoves = (row: number, col: number, piece: PieceType): Position[] => {
    if (!piece) return [];
    
    const moves: Position[] = [];
    const isKing = piece.includes("king");
    const isRed = piece.includes("red");
    
    const directions = isKing 
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : isRed 
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    directions.forEach(([dRow, dCol]) => {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (isValidPosition(newRow, newCol) && !gameState.board[newRow][newCol]) {
        moves.push({ row: newRow, col: newCol });
      }
      
      const jumpRow = row + dRow * 2;
      const jumpCol = col + dCol * 2;
      
      if (isValidPosition(jumpRow, jumpCol) && 
          !gameState.board[jumpRow][jumpCol] &&
          gameState.board[newRow][newCol] &&
          !gameState.board[newRow][newCol]?.includes(isRed ? "red" : "black")) {
        moves.push({ row: jumpRow, col: jumpCol });
      }
    });

    return moves;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameState.winner) return;

    const piece = gameState.board[row][col];
    
    if (piece && piece.includes(gameState.currentPlayer)) {
      const moves = getValidMoves(row, col, piece);
      setGameState(prev => ({
        ...prev,
        selectedPiece: { row, col },
        validMoves: moves,
      }));
      return;
    }

    if (gameState.selectedPiece) {
      const isValidMove = gameState.validMoves.some(
        move => move.row === row && move.col === col
      );

      if (isValidMove) {
        movePiece(gameState.selectedPiece, { row, col });
      }
    }
  };

  const movePiece = (from: Position, to: Position) => {
    const newBoard = gameState.board.map(row => [...row]);
    let piece = newBoard[from.row][from.col];
    
    // Promote to king
    if (piece === "red" && to.row === 0) piece = "red-king";
    if (piece === "black" && to.row === BOARD_SIZE - 1) piece = "black-king";
    
    newBoard[to.row][to.col] = piece;
    newBoard[from.row][from.col] = null;

    // Handle capture
    const rowDiff = Math.abs(to.row - from.row);
    if (rowDiff === 2) {
      const captureRow = (from.row + to.row) / 2;
      const captureCol = (from.col + to.col) / 2;
      newBoard[captureRow][captureCol] = null;
      toast.success("Piece captured!");
    }

    // Count pieces
    let redCount = 0, blackCount = 0;
    newBoard.forEach(row => {
      row.forEach(cell => {
        if (cell?.includes("red")) redCount++;
        if (cell?.includes("black")) blackCount++;
      });
    });

    const nextPlayer = gameState.currentPlayer === "red" ? "black" : "red";
    let winner = null;
    
    if (redCount === 0) winner = "black";
    if (blackCount === 0) winner = "red";

    if (winner) {
      toast.success(`${winner.toUpperCase()} wins! 🏆`);
    }

    setGameState({
      board: newBoard,
      currentPlayer: nextPlayer,
      selectedPiece: null,
      validMoves: [],
      winner,
      scores: { red: redCount, black: blackCount },
    });
  };

  const resetGame = () => {
    setGameState({
      board: createInitialBoard(),
      currentPlayer: "red",
      selectedPiece: null,
      validMoves: [],
      winner: null,
      scores: { red: 12, black: 12 },
    });
    toast.info("New game started!");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2" />
            Back to Hub
          </Button>
          
          <h1 className="text-4xl font-bold text-gradient">Checkers Arena</h1>
          
          <Button variant="gaming" onClick={resetGame}>
            New Game
          </Button>
        </div>

        <div className="grid md:grid-cols-[1fr_400px] gap-8">
          {/* Game Board */}
          <div className="glass p-8 rounded-3xl">
            <div className="aspect-square max-w-2xl mx-auto">
              <div className="grid grid-cols-8 gap-1 bg-border p-2 rounded-2xl">
                {gameState.board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const isLight = (rowIndex + colIndex) % 2 === 0;
                    const isSelected = 
                      gameState.selectedPiece?.row === rowIndex && 
                      gameState.selectedPiece?.col === colIndex;
                    const isValidMove = gameState.validMoves.some(
                      move => move.row === rowIndex && move.col === colIndex
                    );

                    return (
                      <motion.button
                        key={`${rowIndex}-${colIndex}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        className={`aspect-square rounded-lg relative ${
                          isLight 
                            ? "bg-muted/20" 
                            : "bg-muted/50"
                        } ${
                          isSelected ? "ring-4 ring-primary" : ""
                        } ${
                          isValidMove ? "ring-2 ring-accent animate-pulse" : ""
                        }`}
                      >
                        <AnimatePresence>
                          {piece && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className={`absolute inset-2 rounded-full flex items-center justify-center ${
                                piece.includes("red")
                                  ? "bg-red-500 glow-magenta"
                                  : "bg-gray-900 border-2 border-foreground"
                              }`}
                            >
                              {piece.includes("king") && (
                                <Crown className="h-4 w-4 text-yellow-400" />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="space-y-6">
            {/* Current Player */}
            <div className="glass p-6 rounded-2xl border-2 border-primary/30">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground">CURRENT TURN</h3>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${
                  gameState.currentPlayer === "red" 
                    ? "bg-red-500 glow-magenta" 
                    : "bg-gray-900 border-2 border-foreground"
                }`} />
                <span className="text-2xl font-bold">
                  {gameState.currentPlayer.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Scores */}
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold mb-4 text-muted-foreground">PIECES REMAINING</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500" />
                  <span className="font-semibold">Red</span>
                </div>
                <span className="text-2xl font-bold text-red-500">{gameState.scores.red}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-900 border-2 border-foreground" />
                  <span className="font-semibold">Black</span>
                </div>
                <span className="text-2xl font-bold">{gameState.scores.black}</span>
              </div>
            </div>

            {/* Winner */}
            {gameState.winner && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="glass p-6 rounded-2xl border-2 border-accent text-center"
              >
                <Crown className="h-12 w-12 mx-auto mb-4 text-accent" />
                <h3 className="text-2xl font-bold mb-2">WINNER!</h3>
                <p className="text-3xl font-bold text-gradient">
                  {gameState.winner.toUpperCase()}
                </p>
              </motion.div>
            )}

            {/* How to Play */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">HOW TO PLAY</h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Click a piece to select it</li>
                <li>• Click a highlighted square to move</li>
                <li>• Jump over opponent pieces to capture</li>
                <li>• Reach the opposite end to become a King</li>
                <li>• Capture all opponent pieces to win!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
