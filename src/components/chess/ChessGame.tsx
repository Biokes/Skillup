import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"


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

  // Set up pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = { type: "pawn", color: "black" };
    board[6][i] = { type: "pawn", color: "white" };
  }

  // Set up other pieces
  const setup: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  for (let i = 0; i < 8; i++) {
    board[0][i] = { type: setup[i], color: "black" };
    board[7][i] = { type: setup[i], color: "white" };
  }

  return board;
};

export const ChessGame = () => {
  const [board, setBoard] = useState<Board>(initializeBoard());
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PieceColor>("white");
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [capturedPieces, setCapturedPieces] = useState<{ white: Piece[]; black: Piece[] }>({
    white: [],
    black: [],
  });

  const isValidMove = (
    board: Board,
    from: [number, number],
    to: [number, number],
    piece: Piece
  ): boolean => {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // Can't capture own piece
    if (board[toRow][toCol]?.color === piece.color) return false;

    switch (piece.type) {
      case "pawn":
        const direction = piece.color === "white" ? -1 : 1;
        const startRow = piece.color === "white" ? 6 : 1;

        // Move forward
        if (fromCol === toCol && !board[toRow][toCol]) {
          if (toRow === fromRow + direction) return true;
          if (fromRow === startRow && toRow === fromRow + 2 * direction && !board[fromRow + direction][fromCol])
            return true;
        }

        // Capture diagonally
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
        // Check diagonal path
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
        // Queen moves like rook or bishop
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
    if (selectedSquare) {
      const [selectedRow, selectedCol] = selectedSquare;
      const isValid = validMoves.some(([r, c]) => r === row && c === col);

      if (isValid) {
        // Make the move
        const newBoard = board.map((r) => [...r]);
        const piece = newBoard[selectedRow][selectedCol];
        
        // Capture piece if present
        if (newBoard[row][col]) {
          setCapturedPieces((prev) => ({
            ...prev,
            [currentPlayer]: [...prev[currentPlayer], newBoard[row][col]!],
          }));
        }

        newBoard[row][col] = piece;
        newBoard[selectedRow][selectedCol] = null;

        setBoard(newBoard);
        setSelectedSquare(null);
        setValidMoves([]);
        setCurrentPlayer(currentPlayer === "white" ? "black" : "white");
        toast.success(`${currentPlayer} moved!`);

        // Check for checkmate (simplified - just check if king can be captured)
        const opponentColor = currentPlayer === "white" ? "black" : "white";
        let kingFound = false;
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (newBoard[r][c]?.type === "king" && newBoard[r][c]?.color === opponentColor) {
              kingFound = true;
            }
          }
        }
        if (!kingFound) {
          toast.success(`${currentPlayer} wins!`);
        }
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
    setBoard(initializeBoard());
    setSelectedSquare(null);
    setValidMoves([]);
    setCurrentPlayer("white");
    setCapturedPieces({ white: [], black: [] });
    toast.info("Game reset!");
  };
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <Button  onClick={()=>navigate('/hub')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
          <h1 className="text-4xl font-bold text-gradient">Battle Chess</h1>
          <Button onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
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

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Click a piece to select it, then click a highlighted square to move</p>
            <p>Green highlights show valid moves</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
