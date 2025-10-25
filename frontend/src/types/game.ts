export type GameType = 'pingpong' | 'airhockey' | 'chess' | 'pool' | 'rps' | 'checkers';

export type MatchType = 'staked' | 'quick' | 'friendly';

export interface Player {
  name: string;
  rating: number;
  walletAddress?: string;
  socketId?: string;
}

export interface GameState {
  id: string;
  roomCode: string;
  gameType: GameType;
  players: Player[];
  status: 'waiting' | 'active' | 'paused' | 'finished';
  score: number[] | number;
  isPaused: boolean;
}

export interface GameResult {
  winner?: string;
  winnerName?: string;
  isDraw: boolean;
  ratings?: {
    winner: { oldRating: number; newRating: number };
    loser: { oldRating: number; newRating: number };
  };
  stats: {
    duration: number;
    score: number;
  };
}
