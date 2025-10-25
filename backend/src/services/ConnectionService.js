const SessionRepository = require('../repositories/SessionRepository');
const PlayerRepository = require('../repositories/PlayerRepository');

class ConnectionService {
  constructor(io) {
    this.io = io;
    this.sessionRepo = new SessionRepository();
    this.playerRepo = new PlayerRepository();

    // Cleanup inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
  }

  /**
   * Handle new player connection
   * @param {object} socket - Socket.IO socket
   * @param {object} playerData - Player connection data
   * @returns {Promise<object>} Session data
   */
  async handleConnection(socket, playerData) {
    const { playerName, walletAddress, deviceId, metadata = {} } = playerData;

    try {
      // Get or create player
      const player = await this.playerRepo.findOrCreate(playerName, walletAddress);

      // Deactivate old sessions for this socket (in case of reconnection)
      await this.sessionRepo.deactivateSession(socket.id);

      // Create new session
      const session = await this.sessionRepo.createSession(
        player._id,
        player.name,
        socket.id,
        deviceId || socket.id,
        {
          ...metadata,
          userAgent: socket.handshake.headers['user-agent'],
          ipAddress: socket.handshake.address
        }
      );

      // Get all active sessions for this player (multi-device)
      const activeSessions = await this.sessionRepo.findActiveSessions(player._id);

      console.log(`✅ Player connected: ${player.name} (${activeSessions.length} active device(s))`);

      // Notify other devices
      this.notifyOtherDevices(player._id, socket.id, 'device_connected', {
        deviceId: session.deviceId,
        totalDevices: activeSessions.length
      });

      return {
        session,
        player,
        activeDevices: activeSessions.length
      };
    } catch (error) {
      throw new Error(`Failed to handle connection: ${error.message}`);
    }
  }

  /**
   * Handle player disconnection
   * @param {string} socketId
   * @returns {Promise<void>}
   */
  async handleDisconnection(socketId) {
    try {
      const session = await this.sessionRepo.findBySocketId(socketId);

      if (!session) {
        return;
      }

      await this.sessionRepo.deactivateSession(socketId);

      // Check remaining active sessions
      const activeSessions = await this.sessionRepo.findActiveSessions(session.playerId);

      console.log(`👋 Player disconnected: ${session.playerName} (${activeSessions.length} remaining device(s))`);

      // Notify other devices
      this.notifyOtherDevices(session.playerId, socketId, 'device_disconnected', {
        deviceId: session.deviceId,
        totalDevices: activeSessions.length
      });

      // Update player's last active time
      await this.playerRepo.updateActivity(session.playerId);
    } catch (error) {
      console.error(`Error handling disconnection: ${error.message}`);
    }
  }

  /**
   * Sync game state across player's devices
   * @param {string} playerId
   * @param {string} originSocketId - Socket that triggered the sync
   * @param {string} event - Event name
   * @param {object} data - Data to sync
   * @returns {Promise<void>}
   */
  async syncAcrossDevices(playerId, originSocketId, event, data) {
    try {
      const sessions = await this.sessionRepo.findActiveSessions(playerId);

      // Emit to all devices except the origin
      sessions.forEach(session => {
        if (session.socketId !== originSocketId) {
          this.io.to(session.socketId).emit(event, {
            ...data,
            syncedFrom: originSocketId,
            timestamp: Date.now()
          });
        }

        // Update session sync timestamp
        this.sessionRepo.updateSessionRoom(
          session.socketId,
          data.roomCode || null,
          data.gameType || null
        );
      });
    } catch (error) {
      console.error(`Error syncing across devices: ${error.message}`);
    }
  }

  /**
   * Notify other devices of an event
   * @param {string} playerId
   * @param {string} excludeSocketId - Socket to exclude from notification
   * @param {string} event
   * @param {object} data
   * @private
   */
  async notifyOtherDevices(playerId, excludeSocketId, event, data) {
    try {
      const sessions = await this.sessionRepo.findActiveSessions(playerId);

      sessions.forEach(session => {
        if (session.socketId !== excludeSocketId) {
          this.io.to(session.socketId).emit(event, data);
        }
      });
    } catch (error) {
      console.error(`Error notifying other devices: ${error.message}`);
    }
  }

  /**
   * Get player's active sessions
   * @param {string} playerId
   * @returns {Promise<Array>}
   */
  async getActiveSessions(playerId) {
    return await this.sessionRepo.findActiveSessions(playerId);
  }

  /**
   * Update session room/game info
   * @param {string} socketId
   * @param {string} roomCode
   * @param {string} gameType
   * @returns {Promise<void>}
   */
  async updateSessionRoom(socketId, roomCode, gameType) {
    await this.sessionRepo.updateSessionRoom(socketId, roomCode, gameType);
  }

  /**
   * Clean up inactive sessions older than 24 hours
   * @private
   */
  async cleanupInactiveSessions() {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await this.sessionRepo.cleanupInactiveSessions(cutoffTime);

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} inactive sessions`);
      }
    } catch (error) {
      console.error(`Error cleaning up sessions: ${error.message}`);
    }
  }

  /**
   * Force disconnect all sessions for a player
   * @param {string} playerId
   * @returns {Promise<void>}
   */
  async disconnectAllSessions(playerId) {
    try {
      const sessions = await this.sessionRepo.findActiveSessions(playerId);

      sessions.forEach(session => {
        const socket = this.io.sockets.sockets.get(session.socketId);
        if (socket) {
          socket.disconnect(true);
        }
      });

      await this.sessionRepo.deactivateAllPlayerSessions(playerId);

      console.log(`🔌 Disconnected all sessions for player ${playerId}`);
    } catch (error) {
      console.error(`Error disconnecting sessions: ${error.message}`);
    }
  }
}

module.exports = ConnectionService;
