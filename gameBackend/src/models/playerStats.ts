import mongoose from "mongoose";
import { IPlayerStats, GAME_TYPES_ARRAY } from "./types.js";


const playerGameStatsSchema = new mongoose.Schema<IPlayerStats>(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
      index: true,
    },
    playerName: {
      type: String,
      required: true,
      index: true,
    },
    gameType: {
      type: String,
      required: true,
      enum: GAME_TYPES_ARRAY,
      index: true,
    },
    rating: {
      type: Number,
      default: 1000,
      min: 0,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },
    wins: {
      type: Number,
      default: 0,
      min: 0,
    },
    losses: {
      type: Number,
      default: 0,
      min: 0,
    },
    draws: {
      type: Number,
      default: 0,
      min: 0,
    },
    winStreak: {
      type: Number,
      default: 0,
    },
    bestWinStreak: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: String,
      default: "0",
    },
    lastPlayedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

playerGameStatsSchema.index({ playerId: 1, gameType: 1 }, { unique: true });
playerGameStatsSchema.index({ playerName: 1, gameType: 1 });
playerGameStatsSchema.index({ gameType: 1, rating: -1 });

playerGameStatsSchema.virtual("winRate").get(function () {
  if (this.gamesPlayed === 0) return 0;
  return parseFloat(((this.wins / this.gamesPlayed) * 100).toFixed(1));
});

playerGameStatsSchema.methods.updateGameResult = function (result: "win" | "loss" | "draw",earnings = "0"): Promise<IPlayerStats> {
  this.gamesPlayed += 1;
  this.lastPlayedAt = new Date();

  if (result === "win") {
    this.wins += 1;
    this.winStreak += 1;
    this.rating += 10;
    if (this.winStreak > this.bestWinStreak) {
      this.bestWinStreak = this.winStreak;
    }

    if (earnings !== "0") {
      this.totalEarnings = (parseFloat(this.totalEarnings) + parseFloat(earnings)).toString();
    }
  } else if (result === "loss") {
    this.losses += 1;
    this.winStreak = 0;
    this.rating += 1;
  } else if (result === "draw") {
    this.draws += 1;
    this.winStreak = 0;
    this.rating += 3;
  }
  return this.save();
};

playerGameStatsSchema.set("toJSON", { virtuals: true });
playerGameStatsSchema.set("toObject", { virtuals: true });

const PlayerGameStats = mongoose.model<IPlayerStats>("PlayerGameStats",playerGameStatsSchema);

export default PlayerGameStats;
