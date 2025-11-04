import mongoose from "mongoose";
import { IPlayer } from "./types.js";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
      trim: true,
      index: true,
    },
    walletAddress: {
      type: String,
      lowercase: true,
      sparse: true,
      index: true,
      unique: true,
      required: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalLosses: {
      type: Number,
      default: 0,
    },
    totalWins: {
      type: Number,
      default: 0,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

playerSchema.index({ name: 1 });
playerSchema.index({ walletAddress: 1 });

playerSchema.methods.updateActivity = function (): Promise<IPlayer> {
  this.lastActive = new Date();
  return this.save();
};

const Player = mongoose.model<IPlayer>("Player", playerSchema);

module.exports = Player;
