import { IPlayer } from "../models/types.js";
import { BaseRepository } from "./BaseRepository.js";
import Player from "../models/player.js";
import { ChainSkillsException } from "../../exceptions/index.js";
import { Types } from "mongoose";

export class PlayerRepository extends BaseRepository<IPlayer>{
  constructor() {
    super(Player);
  }

  async findByName(name:string) {
    return await this.findOne({ name });
  }

  async findByWalletAddress(walletAddress:string) {
    return await this.findOne({ walletAddress: walletAddress.toLowerCase() });
  }

  async findOrCreate(name:string, walletAddress:string) {
    try {
      let player = await this.findByWalletAddress(walletAddress);
      if (!player) {
        player = await this.create({
          name,
          walletAddress: walletAddress.toLowerCase(),
          lastActive: new Date()
        });
      }

      return player;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new ChainSkillsException(`Error in findOrCreateStats: ${message}, PlayerRepository.ts:34`);    }
  }

  async updateActivity(playerId:Types.ObjectId) {
    return await this.updateById(playerId, { lastActive: new Date() });
  }

    async getActivePlayers(since: Date): Promise<IPlayer[]> {
        return await this.find(
            { lastActive: { $gte: since } },
            { sort: { lastActive: -1 } }
        );
    }
}

