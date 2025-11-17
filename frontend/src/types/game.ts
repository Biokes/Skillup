import React, { ReactNode } from "React";

export type GameType =
  | "pingpong"
  | "airhockey"
  | "chess"
  | "pool"
  | "rps"
  | "checkers";

export type MatchType = "staked" | "quick" | "friendly";

export interface Player {
  name: string;
  rating: number;
  walletAddress?: string;
  socketId?: string;
}

export interface GameState {
  id?: string;
  roomCode?: string;
  gameType?: GameType;
  players: Player[];
  status?: "waiting" | "active" | "paused" | "finished";
  score?: any;
  isPaused: boolean;
  currentPlayer?: any;
  // Game-specific properties
  ball?: any;
  paddle1?: any;
  paddle2?: any;
  puck?: any;
  board?: any;
  capturedPieces?: any;
  currentRally?: number;
}

export interface GameResult {
  winner?: string;
  winnerName?: string;
  isDraw: boolean;
  ratings?: {
    player1: number;
    player2: number;
    player1Change: number;
    player2Change: number;
  };
  stats?: {
    duration: number;
    score: any;
  };
}
export interface GameContextType {
  pauseCountdown: number | null;
  gameType: string | GameType;
  showMatchModal: boolean;
  matchType: MatchType | null;
  roomCode: string;
  showRoomView: "create" | "join" | "waiting" | null;
  gameState: GameState | null;
  isPlaying: boolean;
  isPaused: boolean;
  gameResult: GameResult | null;
  countdown: number | null;
  playerName: string;
  selectMatchType: (type: MatchType) => void;
  setGameType: React.Dispatch<React.SetStateAction<GameType | string>>;
  setShowRoomView: React.Dispatch<React.SetStateAction<"create" | "join" | "waiting" | null>>;
  createFriendlyRoom: () => void;
  joinFriendlyRoom: (code: string) => void;
  createQuickMatch: () => void;
  joinQuickMatch: () => void;
  findQuickMatch: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  forfeitGame: () => void;
  leaveGame: () => void;
  playAgain: () => void;
}

export interface PopupProps {
    isOpen: boolean,
    headerText: string,
    description: string,
    body: ReactNode
}
