import mongoose from "mongoose";
import { GAME_STATUS, IGame } from "./types.js";

const gameSchema = new mongoose.Schema<IGame>(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    gameType: {
      type: String,
      required: true,
      enum: ['pingpong', 'airhockey', 'chess', 'pool', 'checkers'],
      index: true
    },
    player1: {
      name: { type: String, required: false },
      rating: { type: Number, required: true },
      walletAddress: { type: String, lowercase: true }
    },
    player2: {
      name: { type: String , required:false},
      rating: { type: Number },
      walletAddress: { type: String, lowercase: true }
    },
    winner: {
      type: String,
      enum: ['player1', 'player2', null],
      default: null
    },
    score: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isStaked: {
      type: Boolean,
      default: false,
      index: true
    },
    stakeAmount: {
      type: String,
      default: null
    },
    player1Address: {
      type: String,
      lowercase: true,
      index: true
    },
    player2Address: {
      type: String,
      lowercase: true,
      index: true
    },
    player1TxHash: {
      type: String
    },
    player2TxHash: {
      type: String
    },
    winnerAddress: {
      type: String,
      lowercase: true
    },
    claimed: {
      type: Boolean,
      default: false,
      index: true
    },
    claimTxHash: {
      type: String
    },
    claimedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: GAME_STATUS,
      default: 'waiting'
    },
    endedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

gameSchema.index({ gameType: 1, status: 1 });
gameSchema.index({ gameType: 1, createdAt: -1 });
gameSchema.index({ winnerAddress: 1, isStaked: 1, claimed: 1 });
gameSchema.index({ isStaked: 1, claimed: 1 });

gameSchema.methods.markAsClaimed = function(txHash: string): Promise<IGame> {
  this.claimed = true;
  this.claimTxHash = txHash;
  this.claimedAt = new Date();
  return this.save();
};

gameSchema.methods.bothPlayersStaked = function(): boolean {
  return !!(
    this.isStaked &&
    this.player1Address &&
    this.player2Address &&
    this.player1TxHash &&
    this.player2TxHash
  );
};

gameSchema.methods.getPrizeAmount = function(): string {
  if (!this.isStaked || !this.stakeAmount) return '0';
  return ((parseFloat(this.stakeAmount) * 2)*0.98).toString();
};

const Game = mongoose.model<IGame>('Game', gameSchema);
export default Game;
