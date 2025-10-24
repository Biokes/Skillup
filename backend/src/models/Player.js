const mongoose = require("mongoose");

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

playerSchema.methods.updateActivity = function () {
  this.lastActive = new Date();
  return this.save();
};

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;
