import { OneChainGameType } from "@/";
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

// export interface GameState {
//   id?: string;
//   roomCode?: string;
//   gameType?: GameType;
//   players: Player[];
//   status?: "waiting" | "active" | "paused" | "finished";
//   score?: any;
//   isPaused: boolean;
//   currentPlayer?: any;
//   // Game-specific properties
//   ball?: any;
//   paddle1?: any;
//   paddle2?: any;
//   puck?: any;
//   board?: any;
//   capturedPieces?: any;
//   currentRally?: number;
// }

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
  errorMessage: string;
  showRoomView: "create" | "join" | "waiting" | null;
  gameState: GameState | null;
  isPlaying: boolean;
  isPaused: boolean;
  gameResult: GameResult | null;
  countdown: number | null;
  playerName: string;
  selectMatchType: (type: MatchType) => void;
  setGameType: React.Dispatch<React.SetStateAction<GameType | string>>;
  setShowRoomView: React.Dispatch<
    React.SetStateAction<"create" | "join" | "waiting" | null>
  >;
  // createFriendlyRoom: () => void;
  // joinFriendlyRoom: (code: string) => void;
  createQuickMatch: (walletAddress: string, code: string) => void;
  joinQuickMatch: (walletAddress: string, code: string) => void;
  quickMatch: (walletAddress: string) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  forfeitGame: () => void;
  leaveGame: () => void;
  playAgain: () => void;
}

export interface PopupProps {
  isOpen: boolean;
  headerText: string;
  description: string;
  body: JSX.Element;
}
export interface OneChainGameType {
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  quickMatch: (walletAddress: string) => void;
  retryQuickMatch: (walletAddress: string) => void;
  cancelQuickMatch: (walletAddress: string) => void;
  cancelCreateOrJoinMatch: (walletAddress: string, code: string) => void;
  connectFreeWithCode: (walletAddress: string, code: string) => void;
  connectPaid: (walletAddress: string, amount: number) => void;
  connectPaidWithCode: (walletAddress: string, code: string, amount: number) => void;

}
export interface JoinGameResponse {
  sessionId: string;
  status: string;
  isStaked: boolean;
  player1: string;
  player2: string;
  amount: number;
  gameId: string;
}
export interface JoinWithCodeResponse{
  sessionId: string,
  status: string,
  code: string,
  isStaked: string,
  player1: string,
  player2: string,
  amount: number,
  gameId: number
}
export interface PaidGameWaitingResponse { 
  sessionId: string,
  status: string,
  isStaked: boolean,
  player1: string,
  amount: number,
  transaction: string
}
export interface GameBoardProps {
  playerNumber: 1 | 2;
  playerAddresses: { player1: string; player2: string };
  gameId: string;
  sessionId: string;
}
export interface GameState {
  ballX: number;
  ballY: number;
  paddle1Y: number;
  paddle2Y: number;
  paddle1Height: number;
  paddle2Height: number;
  score1: number;
  score2: number;
  activePowerups: { player1: string | null; player2: string | null };
  status:  'COUNTDOWN' | 'PLAYING' | 'SCORE_PAUSE' | 'ENDED';
}
export interface CountdownState {
  active: boolean;
  remaining: number;
}
export interface PongGameState {
    sessionId: string;
    gameId?: string;
    player1: string;
    player2: string;
    amount?: number;
    isStaked: boolean;
    gameType: "quickfree" | "freeCoded" | "staked" | "stakedCoded";
    roomId?: string;
}