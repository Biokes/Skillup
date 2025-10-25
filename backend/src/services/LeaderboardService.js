const PlayerGameStatsRepository = require('../repositories/PlayerGameStatsRepository');
const PlayerRepository = require('../repositories/PlayerRepository');
const { calculateElo } = require('../utils/eloCalculator');

class LeaderboardService {
  constructor() {
    this.statsRepo = new PlayerGameStatsRepository();
    this.playerRepo = new PlayerRepository();
    this.cache = new Map(); // gameType -> { data, timestamp }
    this.CACHE_DURATION = 5000; // 5 seconds
  }

  /**
   * Get leaderboard for a specific game
   * @param {string} gameType - Game type
   * @param {number} limit - Number of players to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} Leaderboard data
   */
  async getGameLeaderboard(gameType, limit = 10, offset = 0) {
    try {
      // Check cache first
      const cacheKey = `${gameType}_${limit}_${offset}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      const leaderboard = await this.statsRepo.getLeaderboard(gameType, limit, offset);

      // Cache the result
      this.cache.set(cacheKey, {
        data: leaderboard,
        timestamp: Date.now()
      });

      return leaderboard;
    } catch (error) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }
  }

  /**
   * Get player stats for a specific game
   * @param {string} playerId - Player ID
   * @param {string} playerName - Player name
   * @param {string} gameType - Game type
   * @returns {Promise<object>} Player stats
   */
  async getPlayerGameStats(playerId, playerName, gameType) {
    try {
      return await this.statsRepo.findOrCreateStats(playerId, playerName, gameType);
    } catch (error) {
      throw new Error(`Failed to get player stats: ${error.message}`);
    }
  }

  /**
   * Get all game stats for a player
   * @param {string} playerId - Player ID
   * @returns {Promise<Array>} All game stats
   */
  async getAllPlayerStats(playerId) {
    try {
      return await this.statsRepo.getAllPlayerStats(playerId);
    } catch (error) {
      throw new Error(`Failed to get all player stats: ${error.message}`);
    }
  }

  /**
   * Get player rank in a specific game
   * @param {string} playerId - Player ID
   * @param {string} gameType - Game type
   * @returns {Promise<number|null>} Player rank or null
   */
  async getPlayerRank(playerId, gameType) {
    try {
      return await this.statsRepo.getPlayerRank(playerId, gameType);
    } catch (error) {
      throw new Error(`Failed to get player rank: ${error.message}`);
    }
  }

  /**
   * Process game result and update ratings
   * @param {object} gameData - Game completion data
   * @returns {Promise<object>} Updated ratings
   */
  async processGameResult(gameData) {
    const {
      gameType,
      player1,
      player2,
      winner,
      isDraw = false,
      earnings = '0'
    } = gameData;

    try {
      // Get or create player records
      const p1 = await this.playerRepo.findOrCreate(player1.name, player1.walletAddress);
      const p2 = await this.playerRepo.findOrCreate(player2.name, player2.walletAddress);

      // Get or create game stats
      const p1Stats = await this.statsRepo.findOrCreateStats(p1._id, p1.name, gameType);
      const p2Stats = await this.statsRepo.findOrCreateStats(p2._id, p2.name, gameType);

      if (isDraw) {
        // Calculate new ratings for draw
        const p1NewRating = calculateElo(p1Stats.rating, p2Stats.rating, 'draw');
        const p2NewRating = calculateElo(p2Stats.rating, p1Stats.rating, 'draw');

        // Update stats
        await this.updatePlayerStats(p1Stats._id, p1NewRating, 'draw');
        await this.updatePlayerStats(p2Stats._id, p2NewRating, 'draw');

        // Invalidate cache
        this.invalidateCache(gameType);

        return {
          player1: { oldRating: p1Stats.rating, newRating: p1NewRating },
          player2: { oldRating: p2Stats.rating, newRating: p2NewRating }
        };
      }

      // Determine winner and loser
      const isPlayer1Winner = winner === 'player1';
      const winnerStats = isPlayer1Winner ? p1Stats : p2Stats;
      const loserStats = isPlayer1Winner ? p2Stats : p1Stats;

      // Calculate new ratings
      let winnerNewRating = calculateElo(winnerStats.rating, loserStats.rating, 'win');
      const loserNewRating = calculateElo(loserStats.rating, winnerStats.rating, 'loss');

      // Ensure winner gains at least 5 points
      winnerNewRating = Math.max(winnerNewRating, winnerStats.rating + 5);

      // Update stats
      await this.updatePlayerStats(winnerStats._id, winnerNewRating, 'win', earnings);
      await this.updatePlayerStats(loserStats._id, loserNewRating, 'loss');

      // Invalidate cache
      this.invalidateCache(gameType);

      return {
        winner: {
          name: winnerStats.playerName,
          oldRating: winnerStats.rating,
          newRating: winnerNewRating
        },
        loser: {
          name: loserStats.playerName,
          oldRating: loserStats.rating,
          newRating: loserNewRating
        }
      };
    } catch (error) {
      throw new Error(`Failed to process game result: ${error.message}`);
    }
  }

  /**
   * Update player stats after a game
   * @param {string} statsId - PlayerGameStats ID
   * @param {number} newRating - New rating
   * @param {string} result - 'win', 'loss', or 'draw'
   * @param {string} earnings - Earnings amount
   * @private
   */
  async updatePlayerStats(statsId, newRating, result, earnings = '0') {
    try {
      const stats = await this.statsRepo.model.findById(statsId);
      if (stats) {
        await stats.updateGameResult(result, newRating, earnings);
      }
    } catch (error) {
      throw new Error(`Failed to update player stats: ${error.message}`);
    }
  }

  /**
   * Get global leaderboard (combined across all games)
   * @param {number} limit - Number of players
   * @returns {Promise<Array>} Global leaderboard
   */
  async getGlobalLeaderboard(limit = 10) {
    try {
      // Aggregate stats across all games
      const stats = await this.statsRepo.model.aggregate([
        {
          $group: {
            _id: '$playerId',
            playerName: { $first: '$playerName' },
            totalRating: { $sum: '$rating' },
            totalGamesPlayed: { $sum: '$gamesPlayed' },
            totalWins: { $sum: '$wins' },
            totalLosses: { $sum: '$losses' },
            totalEarnings: { $sum: { $toDouble: '$totalEarnings' } }
          }
        },
        { $sort: { totalRating: -1 } },
        { $limit: limit }
      ]);

      return stats;
    } catch (error) {
      throw new Error(`Failed to get global leaderboard: ${error.message}`);
    }
  }

  /**
   * Invalidate cache for a game type
   * @param {string} gameType
   * @private
   */
  invalidateCache(gameType) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(gameType)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = LeaderboardService;
