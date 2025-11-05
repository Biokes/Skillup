import { ChainSkillsException } from "../../exceptions/index.js";
import Session from "../models/session.js";
import { GAME_TYPES, ISession } from "../models/types.js";
import { BaseRepository } from "./BaseRepository.js";
import { Types } from "mongoose";

export class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session);
  }

  async findBySocketId(socketId: string) {
    return await this.findOne({ socketId, isActive: true });
  }

  async findActiveSessions(playerId: Types.ObjectId) {
    return await this.find({ playerId, isActive: true });
  }

  async findPlayerByWalletAddress(walletAddress:string) {
    return await this.find({ walletAddress, isActive: true });
  }

  async createSession(playerId: Types.ObjectId, walletAddress:string, socketId:string, deviceId:string) {
    return await this.create({
      playerID: playerId,
      playerWalletAddress: walletAddress.toLowerCase(),
      socketId,
      deviceId,
      isActive: true,
    });
  }

  async deactivateSession(socketId:string) {
    return await this.update(
      { socketId },
      { isActive: false }
    );
  }

  async deactivateAllPlayerSessions(playerId: Types.ObjectId) {
    try {
      return await this.model.updateMany(
        { playerId, isActive: true },
        { isActive: false }
      );
    } catch (error) {
       const message = error instanceof Error ? error.message : String(error);
        throw new ChainSkillsException(`Error in deactivateAllPlayerSessions: ${message}, SessionRepository.ts:48`);
    }
  }

  async updateSessionRoom(socketId:string, roomCode:string, gameType:GAME_TYPES) {
    return await this.update(
      { socketId },
      {
        currentRoom: roomCode,
        currentGame: gameType,
        lastSyncedAt: new Date()
      }
    );
  }
  
    async cleanSessions(olderThan: Date):Promise<void> { 
        try { 
            await this.model.deleteMany({
                isActive: false,
                updatedAt: { $lt: olderThan }
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new ChainSkillsException(`Error in cleanupInactiveSessions: ${message}, SessionRepository.ts:72`);
        }
    } 

}

