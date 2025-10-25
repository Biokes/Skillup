const BaseRepository = require('./BaseRepository');
const Game = require('../models/Game');

class GameRepository extends BaseRepository {
  constructor() {
    super(Game);
  }

  async findByRoomCode(roomCode) {
    return await this.findOne({ roomCode });
  }

  async findActiveGames(gameType = null) {
    const query = { status: { $in: ['waiting', 'playing'] } };
    if (gameType) query.gameType = gameType;

    return await this.find(query, { sort: { createdAt: -1 } });
  }

  async findWaitingGames(gameType) {
    const query = { status: 'waiting', gameType: gameType };
    return await this.find(query, { sort: { createdAt: -1 } });
  }

  async findFinishedGames(gameType = null, limit = 50) {
    const query = { status: 'finished' };
    if (gameType) query.gameType = gameType;

    return await this.find(query, {
      sort: { endedAt: -1 },
      limit
    });
  }

  async findPlayerGames(playerName, gameType = null, status = null) {
    const query = {
      $or: [
        { 'player1.name': playerName },
        { 'player2.name': playerName }
      ]
    };

    if (gameType) query.gameType = gameType;
    if (status) query.status = status;

    return await this.find(query, { sort: { createdAt: -1 } });
  }

  async findUnclaimedWins(walletAddress) {
    return await this.find({
      winnerAddress: walletAddress.toLowerCase(),
      isStaked: true,
      status: 'finished',
      claimed: false
    }, { sort: { endedAt: -1 } });
  }

  async getPlayerGameHistory(playerName, gameType, filters = {}) {
    const { result = 'all', staked = null, limit = 50, offset = 0 } = filters;

    const query = {
      gameType,
      status: 'finished',
      $or: [
        { 'player1.name': playerName },
        { 'player2.name': playerName }
      ]
    };

    if (staked !== null) {
      query.isStaked = staked;
    }

    if (result === 'wins') {
      query.$or = [
        { 'player1.name': playerName, winner: 'player1' },
        { 'player2.name': playerName, winner: 'player2' }
      ];
    } else if (result === 'losses') {
      query.$or = [
        { 'player1.name': playerName, winner: 'player2' },
        { 'player2.name': playerName, winner: 'player1' }
      ];
    } else if (result === 'draws') {
      query.winner = null;
    }

    return await this.find(query, {
      sort: { endedAt: -1 },
      limit,
      skip: offset
    });
  }

  async getGameStats(gameType) {
    try {
      return await this.model.aggregate([
        { $match: { gameType, status: 'finished' } },
        {
          $group: {
            _id: null,
            totalGames: { $sum: 1 },
            stakedGames: {
              $sum: { $cond: ['$isStaked', 1, 0] }
            },
            totalStakeAmount: {
              $sum: {
                $cond: [
                  '$isStaked',
                  { $toDouble: '$stakeAmount' },
                  0
                ]
              }
            },
            claimedGames: {
              $sum: { $cond: ['$claimed', 1, 0] }
            }
          }
        }
      ]);
    } catch (error) {
      throw new Error(`Error getting game stats: ${error.message}`);
    }
  }
}

module.exports = GameRepository;
