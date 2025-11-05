import { ISession } from "./types.js";
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema<ISession>({
  playerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true,
    index: true
  },
  playerName: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true 
  },
  socketId: {
    type: String,
    required: true,
    index: true
  },
  currentRoom: {
    type: String,
    default: null
  },
  currectGame: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

sessionSchema.index({ playerId: 1, isActive: 1 });
sessionSchema.index({ playerName: 1, isActive: 1 });
sessionSchema.index({ socketId: 1, isActive: 1 });

sessionSchema.methods.updateSync = function() {
  this.lastSyncedAt = new Date();
  return this.save();
};

sessionSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

const Session = mongoose.model<ISession>('Session', sessionSchema);

export default Session;
