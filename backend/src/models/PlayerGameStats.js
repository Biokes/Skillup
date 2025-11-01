const mongoose = require('mongoose');

const GAME_TYPES = ['pingpong', 'airhockey', 'chess', 'pool', 'checkers'];

const playerGameStatsSchema = new mongoose.Schema({
  playerId: {
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
  gameType: {
    type: String,
    required: true,
    enum: GAME_TYPES,
    index: true
  },
  rating: {
    type: Number,
    default: 1000,
    min: 0
  },
  gamesPlayed: {
    type: Number,
    default: 0,
    min: 0
  },
  wins: {
    type: Number,
    default: 0,
    min: 0
  },
  losses: {
    type: Number,
    default: 0,
    min: 0
  },
  draws: {
    type: Number,
    default: 0,
    min: 0
  },
  winStreak: {
    type: Number,
    default: 0
  },
  bestWinStreak: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: String,
    default: '0'
  },
  lastPlayedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for unique constraint and efficient lookups
playerGameStatsSchema.index({ playerId: 1, gameType: 1 }, { unique: true });
playerGameStatsSchema.index({ playerName: 1, gameType: 1 });
playerGameStatsSchema.index({ gameType: 1, rating: -1 }); // For leaderboards

// Virtual for win rate
playerGameStatsSchema.virtual('winRate').get(function() {
  if (this.gamesPlayed === 0) return 0;
  return ((this.wins / this.gamesPlayed) * 100).toFixed(1);
});

// Method to update stats after a game
playerGameStatsSchema.methods.updateGameResult = function(result, newRating, earnings = '0') {
  this.gamesPlayed += 1;
  this.rating = newRating;
  this.lastPlayedAt = new Date();

  if (result === 'win') {
    this.wins += 1;
    this.winStreak += 1;
    if (this.winStreak > this.bestWinStreak) {
      this.bestWinStreak = this.winStreak;
    }
    if (earnings !== '0') {
      this.totalEarnings = (parseFloat(this.totalEarnings) + parseFloat(earnings)).toString();
    }
  } else if (result === 'loss') {
    this.losses += 1;
    this.winStreak = 0;
  } else if (result === 'draw') {
    this.draws += 1;
    this.winStreak = 0;
  }

  return this.save();
};

// Ensure virtuals are included in JSON
playerGameStatsSchema.set('toJSON', { virtuals: true });
playerGameStatsSchema.set('toObject', { virtuals: true });

const PlayerGameStats = mongoose.model('PlayerGameStats', playerGameStatsSchema);

module.exports = PlayerGameStats;
module.exports.GAME_TYPES = GAME_TYPES;
