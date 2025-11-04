export type GAME_TYPES = 'pingpong'|'airhockey'| 'chess'| 'pool'|'checkers';

export interface IPlayer {
  name: string;
  rating: number;
  walletAddress?: string;
}

export interface IGame extends Document {
  roomCode: string;
  gameType: GAME_TYPES;
  player1: IPlayer;
  player2?: IPlayer;
  winner: 'player1' | 'player2' | null;
  score: Record<string, any>;
  isStaked: boolean;
  stakeAmount: string | null;
  player1Address?: string;
  player2Address?: string;
  player1TxHash?: string;
  player2TxHash?: string;
  winnerAddress?: string;
  claimed: boolean;
  claimTxHash?: string;
  claimedAt?: Date;
  status: 'waiting' | 'playing' | 'finished';
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  markAsClaimed(txHash: string): Promise<IGame>;
  bothPlayersStaked(): boolean;
  getPrizeAmount(): string;
}