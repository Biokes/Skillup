export type GameType = 'pingpong' | 'airhockey' | 'chess' | 'pool' | 'rps' | 'checkers';

export type MatchType = 'staked' | 'quick' | 'friendly';

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
  status?: 'waiting' | 'active' | 'paused' | 'finished';
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
