import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, User, Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/hooks/useGameContext";
import { GameMatchModal } from "@/components/modals/GameMatchModal";
import { CreateRoomCode } from "@/components/room/CreateRoomCode";
import { JoinRoomCode } from "@/components/room/JoinRoomCode";
import { QuickMatchWaiting } from "@/components/room/QuickMatchWaiting";
import { FriendlyMatchChoice } from "@/components/room/FriendlyMatchChoice";
import { socketService } from "@/services/socketService";

type PieceType = "red" | "black" | "red-king" | "black-king" | null;
type PlayerColor = "red" | "black";

interface Position {
  row: number;
  col: number;
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

export const CheckersBoard = () => {
  const navigate = useNavigate();
  const gameContext = useGame();

  // Local UI state for piece selection
  const [selectedPiece, setSelectedPiece] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [localBoard, setLocalBoard] = useState<PieceType[][]>(createInitialBoard());

  // Use GameContext for multiplayer state
  const {
    showMatchModal,
    matchType,
    roomCode,
    showRoomView,
    gameState: serverGameState,
    isPlaying,
    isPaused,
    gameResult,
    playerName,
    countdown,
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
  } = gameContext;

  // Determine which board to use with proper null checks
  const board = (isPlaying && serverGameState?.board) ? serverGameState.board : localBoard;
  const currentPlayer = (isPlaying && serverGameState?.currentPlayer) ? (serverGameState.currentPlayer as PlayerColor) : "red";
  const scores = (isPlaying && serverGameState?.scores) ? serverGameState.scores : { red: 12, black: 12 };
  const winner = (serverGameState?.winner as PlayerColor) || null;

  // Listen for continueJump event
  useEffect(() => {
    const handleContinueJump = (data: { message: string }) => {
      toast.info(data.message);
    };

    socketService.on('continueJump', handleContinueJump);

    return () => {
      socketService.off('continueJump', handleContinueJump);
    };
  }, []);

  // Sync board from server
  useEffect(() => {
    if (isPlaying && serverGameState?.board) {
      setLocalBoard(serverGameState.board);
    }
  }, [isPlaying, serverGameState]);

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

      if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
        moves.push({ row: newRow, col: newCol });
      }

      const jumpRow = row + dRow * 2;
      const jumpCol = col + dCol * 2;

      if (isValidPosition(jumpRow, jumpCol) &&
        !board[jumpRow][jumpCol] &&
        board[newRow][newCol] &&
        !board[newRow][newCol]?.includes(isRed ? "red" : "black")) {
        moves.push({ row: jumpRow, col: jumpCol });
      }
    });

    return moves;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (winner) return;

    // In multiplayer, check if it's our turn
    if (isPlaying && serverGameState?.players) {
      // Prevent interaction if paused
      if (isPaused) {
        toast.info("Game is paused");
        return;
      }

      // Check if it's our turn (player 1 is red, player 2 is black)
      const myPlayerIndex = serverGameState.players.findIndex((p: { name: string; rating?: number }) => p?.name === playerName);

      if (myPlayerIndex === -1) {
        console.warn("Player not found in game state");
        return;
      }

      const myColor = myPlayerIndex === 0 ? 'red' : 'black';

      if (currentPlayer !== myColor) {
        toast.info("It's not your turn!");
        return;
      }
    }

    const piece = board[row][col];

    if (piece && piece.includes(currentPlayer)) {
      const moves = getValidMoves(row, col, piece);
      setSelectedPiece({ row, col });
      setValidMoves(moves);
      return;
    }

    if (selectedPiece) {
      const isValidMove = validMoves.some(
        move => move.row === row && move.col === col
      );

      if (isValidMove) {
        if (isPlaying) {
          // Send move to server
          socketService.checkersMove({ from: selectedPiece, to: { row, col } });
        } else {
          // Local play
          movePieceLocally(selectedPiece, { row, col });
        }

        setSelectedPiece(null);
        setValidMoves([]);
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  };

  const movePieceLocally = (from: Position, to: Position) => {
    const newBoard = localBoard.map(row => [...row]);
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

    setLocalBoard(newBoard);
  };

  const resetGame = () => {
    if (isPlaying) {
      leaveGame();
    }
    setLocalBoard(createInitialBoard());
    setSelectedPiece(null);
    setValidMoves([]);
    toast.info("New game started!");
  };

  return (
    <div className="min-h-screen bg-background p-2 md:p-8">
      {/* Match Type Selection Modal */}
      <GameMatchModal
        isOpen={showMatchModal}
        onSelectMatchType={selectMatchType}
        onCreateMatch={createQuickMatch}
        onJoinQuickMatch={joinQuickMatch}
        onClose={() => navigate('/hub')}
      />

      {/* Room Views */}
      {showRoomView === 'create' && roomCode && (
        <CreateRoomCode roomCode={roomCode} onCancel={leaveGame} countdown={countdown} />
      )}
      {showRoomView === 'join' && (
        <JoinRoomCode onJoin={joinFriendlyRoom} onBack={() => setShowRoomView(null)} />
      )}
      {showRoomView === 'waiting' && (
        <QuickMatchWaiting onCancel={leaveGame} countdown={countdown} />
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
              <Crown className="h-12 w-12 mx-auto text-accent" />
              <h3 className="text-2xl font-bold">WINNER!</h3>
              <p className="text-3xl font-bold text-gradient">
                {gameResult.winnerName?.toUpperCase()}
              </p>
              {gameResult.ratings && (
                <div className="space-y-2">
                  <p>Rating Changes:</p>
                  <div className="flex justify-between">
                    <span>Player 1</span>
                    <span className={gameResult.ratings.player1Change > 0 ? 'text-green-400' : 'text-red-400'}>
                      {gameResult.ratings.player1} ({gameResult.ratings.player1Change > 0 ? '+' : ''}{gameResult.ratings.player1Change})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Player 2</span>
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

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <Button variant="outline" onClick={() => navigate('/hub')}>
            <ArrowLeft className="mr-2" />
            <span className="hidden md:inline">Back to Hub</span>
          </Button>

          <h1 className="text-2xl md:text-4xl font-bold text-gradient">Checkers Arena</h1>

          <div className="flex gap-2">
            {isPlaying && (
              <Button onClick={isPaused ? resumeGame : pauseGame} variant="outline" size="icon">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="gaming" onClick={resetGame}>
              <span className="hidden md:inline">New Game</span>
              <span className="md:hidden">New</span>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_300px_lg:400px] gap-4 md:gap-8">
          {/* Game Board */}
          <div className="glass p-4 md:p-8 rounded-3xl">
            <div className="aspect-square max-w-2xl mx-auto">
              <div className="grid grid-cols-8 gap-1 bg-border p-2 rounded-2xl">
                {board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const isLight = (rowIndex + colIndex) % 2 === 0;
                    const isSelected =
                      selectedPiece?.row === rowIndex &&
                      selectedPiece?.col === colIndex;
                    const isValidMove = validMoves.some(
                      move => move.row === rowIndex && move.col === colIndex
                    );

                    return (
                      <motion.button
                        key={`${rowIndex}-${colIndex}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSquareClick(rowIndex, colIndex)}
                        disabled={isPaused && isPlaying}
                        className={`aspect-square rounded-lg relative ${isLight
                          ? "bg-muted/20"
                          : "bg-muted/50"
                          } ${isSelected ? "ring-4 ring-primary" : ""
                          } ${isValidMove ? "ring-2 ring-accent animate-pulse" : ""
                          }`}
                      >
                        <AnimatePresence>
                          {piece && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className={`absolute inset-2 rounded-full flex items-center justify-center ${piece.includes("red")
                                ? "bg-red-500 glow-magenta"
                                : "bg-gray-900 border-2 border-foreground"
                                }`}
                            >
                              {piece.includes("king") && (
                                <Crown className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
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
          <div className="space-y-4 md:space-y-6">
            {/* Current Player */}
            <div className="glass p-4 md:p-6 rounded-2xl border-2 border-primary/30">
              <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-4 text-muted-foreground">CURRENT TURN</h3>
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full ${currentPlayer === "red"
                  ? "bg-red-500 glow-magenta"
                  : "bg-gray-900 border-2 border-foreground"
                  }`} />
                <span className="text-xl md:text-2xl font-bold">
                  {currentPlayer.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Players Info (Multiplayer) */}
            {isPlaying && serverGameState?.players && (
              <div className="glass p-4 md:p-6 rounded-2xl space-y-3">
                <h3 className="text-xs md:text-sm font-semibold mb-2 text-muted-foreground">PLAYERS</h3>
                {serverGameState.players.map((player: { name: string; rating?: number }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${idx === 0 ? 'bg-red-500' : 'bg-gray-900 border-2 border-foreground'}`} />
                      <span className="font-semibold text-sm">{player.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {player.name === playerName ? '(You)' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Scores */}
            <div className="glass p-4 md:p-6 rounded-2xl space-y-3 md:space-y-4">
              <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-4 text-muted-foreground">PIECES REMAINING</h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-red-500" />
                  <span className="font-semibold text-sm md:text-base">Red</span>
                </div>
                <span className="text-xl md:text-2xl font-bold text-red-500">{scores.red}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-900 border-2 border-foreground" />
                  <span className="font-semibold text-sm md:text-base">Black</span>
                </div>
                <span className="text-xl md:text-2xl font-bold">{scores.black}</span>
              </div>
            </div>

            {winner && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="glass p-4 md:p-6 rounded-2xl border-2 border-accent text-center"
              >
                <Crown className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 md:mb-4 text-accent" />
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">WINNER!</h3>
                <p className="text-2xl md:text-3xl font-bold text-gradient">
                  {winner.toUpperCase()}
                </p>
              </motion.div>
            )}

            {/* How to Play */}
            <div className="glass p-4 md:p-6 rounded-2xl">
              <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 text-muted-foreground">HOW TO PLAY</h3>
              <ul className="text-xs md:text-sm space-y-1 md:space-y-2 text-muted-foreground">
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
