const BaseRepository = require('./BaseRepository');
const PlayerGameStats = require('../models/PlayerGameStats');

class PlayerGameStatsRepository extends BaseRepository {
  constructor() {
    super(PlayerGameStats);
  }

  async findByPlayerAndGame(playerId, gameType) {
    return await this.findOne({ playerId, gameType });
  }

  async findOrCreateStats(playerId, playerName, gameType) {
    try {
      let stats = await this.findByPlayerAndGame(playerId, gameType);

      if (!stats) {
        stats = await this.create({
          playerId,
          playerName,
          gameType,
          rating: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winStreak: 0,
          bestWinStreak: 0,
          totalEarnings: '0'
        });
      }

      return stats;
    } catch (error) {
      throw new Error(`Error in findOrCreateStats: ${error.message}`);
    }
  }

  async getLeaderboard(gameType, limit = 10, offset = 0) {
    return await this.find(
      { gameType },
      {
        sort: { rating: -1 },
        limit,
        skip: offset
      }
    );
  }

  async getPlayerRank(playerId, gameType) {
    try {
      const playerStats = await this.findByPlayerAndGame(playerId, gameType);
      if (!playerStats) return null;

      const rank = await this.model.countDocuments({
        gameType,
        rating: { $gt: playerStats.rating }
      });

      return rank + 1;
    } catch (error) {
      throw new Error(`Error getting player rank: ${error.message}`);
    }
  }

  async getAllPlayerStats(playerId) {
    return await this.find({ playerId });
  }

  async getTopPlayersByWinRate(gameType, minGames = 10, limit = 10) {
    try {
      return await this.model.aggregate([
        {
          $match: {
            gameType,
            gamesPlayed: { $gte: minGames }
          }
        },
        {
          $addFields: {
            winRate: {
              $multiply: [
                { $divide: ['$wins', '$gamesPlayed'] },
                100
              ]
            }
          }
        },
        { $sort: { winRate: -1 } },
        { $limit: limit }
      ]);
    } catch (error) {
      throw new Error(`Error getting top players by win rate: ${error.message}`);
    }
  }
}

module.exports = PlayerGameStatsRepository;
