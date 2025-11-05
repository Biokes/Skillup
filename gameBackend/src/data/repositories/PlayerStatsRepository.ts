import PlayerGameStats from "../models/playerStats.js";
import { IPlayerStats } from "../models/types.js";
import { BaseRepository } from "./BaseRepository.js";
import { GAME_TYPES } from "../models/types.js";
import { Types } from 'mongoose';
import { ChainSkillsException } from "../../exceptions/index.js";

export class PlayerGameStatsRepository extends BaseRepository<IPlayerStats> {
  constructor() {
    super(PlayerGameStats);
  }

  async findByPlayerAndGame(playerId: Types.ObjectId, gameType:GAME_TYPES) {
    return await this.findOne({ playerId, gameType });
  }

  async findOrCreateStats(playerId: Types.ObjectId, playerName:string, gameType: GAME_TYPES) {
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
        const message = error instanceof Error ? error.message : String(error);
        throw new ChainSkillsException(`Error in findOrCreateStats: ${message}, PlayerStatsRepository.ts:39`);
    }
  }

  async getLeaderboard(gameType: GAME_TYPES, limit:number = 10, offset:number = 0) {
    return await this.find(
      { gameType },
      {
        sort: { rating: -1 },
        limit,
        skip: offset
      }
    );
  }

  async getPlayerRank(playerId:Types.ObjectId, gameType:GAME_TYPES) {
    try {
      const playerStats = await this.findByPlayerAndGame(playerId, gameType);
      if (!playerStats) return null;

      const rank = await this.model.countDocuments({
        gameType,
        rating: { $gt: playerStats.rating }
      });

      return rank + 1;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ChainSkillsException(`Error in findOrCreateStats: ${message}, PlayerStatsRepository.ts:67`);
    }
  }

  async getAllPlayerStats(playerId: Types.ObjectId) {
    return await this.find({ playerId });
  }

  async getTopPlayersByWinRate(gameType:GAME_TYPES, minGames:number = 10, limit:number = 10) {
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
        const message = error instanceof Error ? error.message : String(error);
        throw new ChainSkillsException(`Error in findOrCreateStats: ${message}, PlayerStatsRepository.ts:99`);    }
  }
}

