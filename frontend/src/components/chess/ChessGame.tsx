import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { GameMatchModal } from "@/components/modals/GameMatchModal";
import { CreateRoomCode } from "@/components/room/CreateRoomCode";
import { JoinRoomCode } from "@/components/room/JoinRoomCode";
import { QuickMatchWaiting } from "@/components/room/QuickMatchWaiting";
import { FriendlyMatchChoice } from "@/components/room/FriendlyMatchChoice";
import { socketService } from "@/services/socketService";


type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";
type PieceColor = "white" | "black";

interface Piece {
  type: PieceType;
  color: PieceColor;
}

type Board = (Piece | null)[][];

const pieceSymbols: Record<PieceColor, Record<PieceType, string>> = {
  white: {
    king: "♔",
    queen: "♕",
    rook: "♖",
    bishop: "♗",
    knight: "♘",
    pawn: "♙",
  },
  black: {
    king: "♚",
    queen: "♛",
    rook: "♜",
    bishop: "♝",
    knight: "♞",
    pawn: "♟",
  },
};

const initializeBoard = (): Board => {
  const board: Board = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: "pawn", color: "black" };
    board[6][i] = { type: "pawn", color: "white" };
  }

  const setup: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: setup[i], color: "black" };
    board[7][i] = { type: setup[i], color: "white" };
  }

  return board;
};

export const ChessGame = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);

  // Multiplayer integration
  const {
    showMatchModal,
    matchType,
    roomCode,
    showRoomView,
    gameState,
    isPlaying,
    isPaused,
    gameResult,
    playerName,
    selectMatchType,
    createFriendlyRoom,
    joinFriendlyRoom,
    createQuickMatch,
    joinQuickMatch,
    pauseGame,
    resumeGame,
    forfeitGame,
    leaveGame,
    playAgain,
    setShowRoomView,
  } = useMultiplayerGame('chess');

  // Get game state from server
  const currentPlayer = gameState?.currentPlayer || 'white';
  const capturedPieces = gameState?.capturedPieces || { white: [], black: [] };
  const players = gameState?.players || [];

  // Sync board from server game state
  useEffect(() => {
    if (gameState && isPlaying && gameState.board) {
      setBoard(gameState.board);
    }
  }, [gameState, isPlaying]);

  const isValidMove = (board: Board,from: [number, number],to: [number, number],piece: Piece): boolean => {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    if (board[toRow][toCol]?.color === piece.color) return false;

    switch (piece.type) {
      case "pawn":
        const direction = piece.color === "white" ? -1 : 1;
        const startRow = piece.color === "white" ? 6 : 1;

        if (fromCol === toCol && !board[toRow][toCol]) {
          if (toRow === fromRow + direction) return true;
          if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[fromRow + direction][fromCol])
            return true;
        }

        if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && board[toRow][toCol]) {
          return true;
        }
        return false;

      case "rook":
        if (fromRow !== toRow && fromCol !== toCol) return false;
        // Check path is clear
        if (fromRow === toRow) {
          const start = Math.min(fromCol, toCol) + 1;
          const end = Math.max(fromCol, toCol);
          for (let c = start; c < end; c++) {
            if (board[fromRow][c]) return false;
          }
        } else {
          const start = Math.min(fromRow, toRow) + 1;
          const end = Math.max(fromRow, toRow);
          for (let r = start; r < end; r++) {
            if (board[r][fromCol]) return false;
          }
        }
        return true;

      case "knight":
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

      case "bishop":
        if (rowDiff !== colDiff) return false;
        const rowStep = toRow > fromRow ? 1 : -1;
        const colStep = toCol > fromCol ? 1 : -1;
        let r = fromRow + rowStep;
        let c = fromCol + colStep;
        while (r !== toRow && c !== toCol) {
          if (board[r][c]) return false;
          r += rowStep;
          c += colStep;
        }
        return true;

      case "queen":
        return (
          isValidMove(board, from, to, { ...piece, type: "rook" }) ||
          isValidMove(board, from, to, { ...piece, type: "bishop" })
        );

      case "king":
        return rowDiff <= 1 && colDiff <= 1;

      default:
        return false;
    }
  };

  const getValidMoves = (row: number, col: number): [number, number][] => {
    const piece = board[row][col];
    if (!piece || piece.color !== currentPlayer) return [];

    const moves: [number, number][] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isValidMove(board, [row, col], [r, c], piece)) {
          moves.push([r, c]);
        }
      }
    }
    return moves;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (!isPlaying || isPaused) return;

    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      const isValid = validMoves.some(([r, c]) => r === row && c === col);

      if (isValid) {
        // Convert row/col to chess notation (e.g., "e2" to "e4")
        const fromNotation = `${String.fromCharCode(97 + selectedCol)}${8 - selectedRow}`;
        const toNotation = `${String.fromCharCode(97 + col)}${8 - row}`;

        // Emit move to server
        socketService.chessMove({ from: fromNotation, to: toNotation });

        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      const piece = board[row][col];
      if (piece && piece.color === currentPlayer) {
        setSelectedSquare([row, col]);
        setValidMoves(getValidMoves(row, col));
      }
    }
  };

  const handleReset = () => {
    leaveGame();
    setSelectedSquare(null);
    setValidMoves([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-2 md:p-4">
      {/* Match Type Selection Modal */}
      {showMatchModal && (
        <GameMatchModal
          onSelectMatchType={selectMatchType}
          onCreateQuickMatch={createQuickMatch}
          onJoinQuickMatch={joinQuickMatch}
          onClose={() => navigate('/hub')}
        />
      )}

      {/* Room Views */}
      {showRoomView === 'create' && roomCode && (
        <CreateRoomCode roomCode={roomCode} onCancel={leaveGame} />
      )}
      {showRoomView === 'join' && (
        <JoinRoomCode onJoin={joinFriendlyRoom} onCancel={() => setShowRoomView(null)} />
      )}
      {showRoomView === 'waiting' && (
        <QuickMatchWaiting onCancel={leaveGame} />
      )}
      {matchType === 'friendly' && !showRoomView && !isPlaying && (
        <FriendlyMatchChoice
          onCreateRoom={createFriendlyRoom}
          onJoinRoom={() => setShowRoomView('join')}
          onCancel={leaveGame}
        />
      )}

      {/* Game Over Modal */}
      {gameResult && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="glass p-6 md:p-8 rounded-2xl max-w-md w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                {gameResult.winnerName ? `${gameResult.winnerName} Wins! 🏆` : 'Draw!'}
              </div>
              {gameResult.ratings && (
                <div className="space-y-2">
                  <p className="text-lg">Rating Changes:</p>
                  <div className="flex justify-between">
                    <span>{players[0]?.name || 'Player 1'}</span>
                    <span className={gameResult.ratings.player1Change > 0 ? 'text-green-400' : 'text-red-400'}>
                      {gameResult.ratings.player1} ({gameResult.ratings.player1Change > 0 ? '+' : ''}{gameResult.ratings.player1Change})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{players[1]?.name || 'Player 2'}</span>
                    <span className={gameResult.ratings.player2Change > 0 ? 'text-green-400' : 'text-red-400'}>
                      {gameResult.ratings.player2} ({gameResult.ratings.player2Change > 0 ? '+' : ''}{gameResult.ratings.player2Change})
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-4 mt-6">
                <Button variant="gaming" className="flex-1" onClick={playAgain}>
                  Play Again
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate('/hub')}>
                  Exit
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate('/hub')}>
            <ArrowLeft className="md:mr-2 h-4 w-4" />
            <span className="hidden md:flex">Back to Hub</span>
          </Button>
          <h1 className="text-lg md:text-4xl font-bold text-gradient text-nowrap">Battle Chess</h1>
          <div className="flex gap-2">
            {isPlaying && (
              <Button onClick={isPaused ? resumeGame : pauseGame} variant="outline" size="icon">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Reset</span>
            </Button>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl">
          <div className="flex justify-between mb-6">
            <div className="glass p-4 rounded-xl">
              <div className="text-sm text-muted-foreground mb-2">Captured by White</div>
              <div className="flex gap-1 flex-wrap">
                {capturedPieces.white.map((piece, i) => (
                  <span key={i} className="text-2xl">
                    {pieceSymbols[piece.color][piece.type]}
                  </span>
                ))}
              </div>
            </div>

            <div className={`text-center p-4 rounded-xl ${currentPlayer === "white" ? "glass border-2 border-primary" : ""}`}>
              <div className="text-2xl font-bold text-gradient">
                {currentPlayer === "white" ? "White's Turn" : "Black's Turn"}
              </div>
            </div>

            <div className="glass p-4 rounded-xl">
              <div className="text-sm text-muted-foreground mb-2">Captured by Black</div>
              <div className="flex gap-1 flex-wrap">
                {capturedPieces.black.map((piece, i) => (
                  <span key={i} className="text-2xl">
                    {pieceSymbols[piece.color][piece.type]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-8 gap-0 border-4 border-primary/30 rounded-xl overflow-hidden mx-auto max-w-[600px] aspect-square">
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected =
                  selectedSquare && selectedSquare[0] === rowIndex && selectedSquare[1] === colIndex;
                const isValidMove = validMoves.some(([r, c]) => r === rowIndex && c === colIndex);

                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      aspect-square flex items-center justify-center text-5xl font-bold
                      transition-all relative
                      ${isLight ? "bg-primary/10" : "bg-secondary/10"}
                      ${isSelected ? "bg-accent/50 ring-2 ring-accent" : ""}
                      ${isValidMove ? "bg-green-500/30 ring-2 ring-green-500" : ""}
                      hover:bg-primary/20
                    `}
                  >
                    {piece && pieceSymbols[piece.color][piece.type]}
                    {isValidMove && !piece && (
                      <div className="absolute w-4 h-4 rounded-full bg-green-500/50" />
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
