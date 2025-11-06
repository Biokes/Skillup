import { Document, Types } from "mongoose";

export type GAME_TYPES =
  | "pingpong"
  | "airhockey"
  | "chess"
  | "pool"
  | "checkers";

export interface IPlayerBase {
  name: string;
  walletAddress: string;
  avatar: string | null;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayer extends IPlayerBase, Document {
  updateActivity(): Promise<IPlayer>;
}

export interface IPlayerStatsBase {
  playerId: Types.ObjectId;
  playerName: string;
  gameType: GAME_TYPES;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestWinStreak: number;
  totalEarnings: string;
  lastPlayedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlayerStats extends IPlayerStatsBase, Document {
  winRate: number;
  updateGameResult(
    result: "win" | "loss" | "draw",
    earnings?: string
  ): Promise<IPlayerStats>;
}

export interface IGamePlayer {
  name: string;
  // rating: number;
  walletAddress?: string;
}

export interface IGame extends Document {
  roomCode: string;
  gameType: GAME_TYPES;
  player1: IGamePlayer;
  player2?: IGamePlayer;
  winner: "player1" | "player2" | null;
  score: Record<string, number>;
  stakeAmount: number;
  player1Address?: string;
  player2Address?: string;
  player1TxHash?: string;
  player2TxHash?: string;
  winnerAddress?: string;
  claimed: boolean;
  claimTxHash?: string;
  claimedAt?: Date;
  status: "waiting" | "playing" | "finished";
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // markAsClaimed(txHash: string): Promise<IGame>;
  // bothPlayersStaked(): boolean;
  // getPrizeAmount(): string;
}

export const GAME_TYPES_ARRAY = [
  "pingpong",
  "airhockey",
  "chess",
  "pool",
  "checkers",
] as const;
export const GAME_STATUS = ["waiting", "playing", "finished"] as const;
export interface ISession extends Document{
  playerID: Types.ObjectId;
  playerWalletAddress : string;
  deviceId: string;
  socketId: string;
  currentRoom: string;
  currectGame: string;
  isActive: boolean;
}
export interface FindOptions {
  sort?: Record<string, 1 | -1 | "asc" | "desc">;
  limit?: number;
  skip?: number;
  select?: string | Record<string, 0 | 1>;
  populate?: string | Record<string, any>;
}
export type GAME_STATUS = "waiting" | "playing" | "finished";
