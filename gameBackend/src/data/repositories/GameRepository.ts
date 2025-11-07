import { FilterQuery } from "mongoose";
import { BaseRepository } from "./BaseRepository.js";
import Game from "../models/game.js";
import { IGame, GAME_TYPES, GAME_STATUS } from "../models/types.js";
import { ChainSkillsException } from "../../exceptions/index.js";

export class GameRepository extends BaseRepository<IGame> {
  constructor() {
    super(Game);
  }

  async findByRoomCode(roomCode: string): Promise<IGame | null> {
    return await this.findOne({ roomCode });
  }

  async findActiveGames(gameType: GAME_TYPES): Promise<IGame[]> {
    const query: FilterQuery<IGame> = {
      status: { $in: ["waiting", "playing"] },
      gameType : gameType
    };
    return await this.find(query, { sort: { createdAt: -1 } });
  }

  async findWaitingGames(gameType: GAME_TYPES): Promise<IGame[]> {
    const query: FilterQuery<IGame> = { status: "waiting", gameType };
    return await this.find(query, { sort: { createdAt: -1 } });
  }

  async findFinishedGames(gameType: GAME_TYPES,limit: number = 50): Promise<IGame[]> {
    const query: FilterQuery<IGame> = { status: "finished", gameType };
    return await this.find(query, { sort: { endedAt: -1 }, limit });
  }

  async findPlayerGames(playerAddress: string,gameType: GAME_TYPES | null = null,status: GAME_STATUS | null = null): Promise<IGame[]> {
    const query: FilterQuery<IGame> = {
      $or: [
        { "player1.walletAddress": playerAddress },
        { "player2.walletAddress": playerAddress },
      ],
    };
    if (gameType) query.gameType = gameType;
    if (status) query.status = status;
    return await this.find(query, { sort: { createdAt: -1 } });
  }

  async findUnclaimedWins(walletAddress: string): Promise<IGame[]> {
    return await this.find(
      {
        winnerAddress: walletAddress.toLowerCase(),
        isStaked: true,
        status: "finished",
        claimed: false,
      },
      { sort: { endedAt: -1 } }
    );
  }

  async getPlayerGameHistory(playerAddress: string,gameType:GAME_TYPES,filters:{result?:"win"|"loss"|"draw";staked?:boolean|null;limit?:number;offset?:number;}={}): Promise<IGame[]> {
    const { result = "all", staked = null, limit = 50, offset = 0 } = filters;
    const query: FilterQuery<IGame> = {
      gameType,
      status: "finished",
      $or: [
        { "player1.name": playerAddress },
        { "player2.name": playerAddress },
      ],
    };
    if (staked !== null) query.isStaked = staked;
    if (result === "win") {
      query.$or = [
        { "player1.walletAddress": playerAddress, winner: "player1" },
        { "player2.walletAddress": playerAddress, winner: "player2" },
      ];
    } else if (result === "loss") {
      query.$or = [
        { "player1.walletAddress": playerAddress, winner: "player2" },
        { "player2.walletAddress": playerAddress, winner: "player1" },
      ];
    } else {
      query.winner = null;
    }
    return await this.find(query, {
      sort: { endedAt: -1 },
      limit,
      skip: offset,
    });
  }

  async getGameStats(gameType: GAME_TYPES) {
    try {
      return await this.model.aggregate([
        { $match: { gameType, status: "finished" } },
        {
          $group: {
            _id: null,
            totalGames: { $sum: 1 },
            stakedGames: { $sum: { $cond: ["$isStaked", 1, 0] } },
            totalStakeAmount: {
              $sum: {
                $cond: ["$isStaked", { $toDouble: "$stakeAmount" }, 0],
              },
            },
            claimedGames: { $sum: { $cond: ["$claimed", 1, 0] } },
          },
        },
      ]);
    } catch (error: any) {
      throw new ChainSkillsException( `Error getting game stats: ${error.message}, GameRpository.ts:108`);
    }
  }
}
