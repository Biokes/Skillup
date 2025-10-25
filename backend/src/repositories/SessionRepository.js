const BaseRepository = require('./BaseRepository');
const Session = require('../models/Session');

class SessionRepository extends BaseRepository {
  constructor() {
    super(Session);
  }

  async findBySocketId(socketId) {
    return await this.findOne({ socketId, isActive: true });
  }

  async findActiveSessions(playerId) {
    return await this.find({ playerId, isActive: true });
  }

  async findByPlayerName(playerName) {
    return await this.find({ playerName, isActive: true });
  }

  async createSession(playerId, playerName, socketId, deviceId, metadata = {}) {
    return await this.create({
      playerId,
      playerName,
      socketId,
      deviceId,
      metadata,
      isActive: true,
      lastSyncedAt: new Date()
    });
  }

  async deactivateSession(socketId) {
    return await this.update(
      { socketId },
      { isActive: false }
    );
  }

  async deactivateAllPlayerSessions(playerId) {
    try {
      return await this.model.updateMany(
        { playerId, isActive: true },
        { isActive: false }
      );
    } catch (error) {
      throw new Error(`Error deactivating sessions: ${error.message}`);
    }
  }

  async updateSessionRoom(socketId, roomCode, gameType) {
    return await this.update(
      { socketId },
      {
        currentRoom: roomCode,
        currentGame: gameType,
        lastSyncedAt: new Date()
      }
    );
  }

  async cleanupInactiveSessions(olderThan) {
    try {
      return await this.model.deleteMany({
        isActive: false,
        updatedAt: { $lt: olderThan }
      });
    } catch (error) {
      throw new Error(`Error cleaning up sessions: ${error.message}`);
    }
  }
}

module.exports = SessionRepository;
