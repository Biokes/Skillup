/**
 * Room Service
 * Manages game rooms for all game types
 */

class RoomService {
  constructor() {
    this.rooms = new Map(); // roomCode -> room data
    this.ROOM_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    // Cleanup stale rooms every 5 minutes
    setInterval(() => {
      this.cleanupStaleRooms();
    }, 5 * 60 * 1000);
  }

  /**
   * Create a new room
   * @param {string} gameType - Type of game
   * @param {object} host - Host player data
   * @param {string} socketId - Host socket ID
   * @param {string} roomCode - Optional custom room code
   * @returns {object} Room data
   */
  createRoom(gameType, host, socketId, roomCode = null) {
    const code = roomCode || this.generateRoomCode();

    if (this.rooms.has(code)) {
      throw new Error('Room already exists');
    }

    const room = {
      code,
      gameType,
      host: { ...host, socketId },
      guest: null,
      spectators: new Set(),
      status: 'waiting', // waiting, ready, playing, finished
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isStaked: false
    };

    this.rooms.set(code, room);
    console.log(`🎮 Room created: ${code} (${gameType})`);

    return room;
  }

  /**
   * Join an existing room
   * @param {string} roomCode
   * @param {object} guest - Guest player data
   * @param {string} socketId - Guest socket ID
   * @returns {object} { success: boolean, room?: object, error?: string }
   */
  joinRoom(roomCode, guest, socketId) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.status !== 'waiting') {
      return { success: false, error: 'Room is not available' };
    }

    if (room.guest) {
      return { success: false, error: 'Room is full' };
    }

    room.guest = { ...guest, socketId };
    room.status = 'ready';
    room.lastActivity = Date.now();

    console.log(`👥 Player joined room: ${roomCode}`);

    return { success: true, room };
  }

  /**
   * Get room by code
   * @param {string} roomCode
   * @returns {object|null}
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode) || null;
  }

  /**
   * Get room by player socket ID
   * @param {string} socketId
   * @returns {object|null}
   */
  getRoomByPlayer(socketId) {
    for (const room of this.rooms.values()) {
      if (room.host?.socketId === socketId || room.guest?.socketId === socketId) {
        return room;
      }
    }
    return null;
  }

  /**
   * Start game in room
   * @param {string} roomCode
   * @returns {boolean} Success
   */
  startGame(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room || room.status !== 'ready') {
      return false;
    }

    room.status = 'playing';
    room.lastActivity = Date.now();

    console.log(`▶️  Game started in room: ${roomCode}`);
    return true;
  }

  /**
   * End game in room
   * @param {string} roomCode
   * @returns {boolean} Success
   */
  endGame(roomCode) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return false;
    }

    room.status = 'finished';
    room.lastActivity = Date.now();

    // Remove room after a delay
    setTimeout(() => {
      this.removeRoom(roomCode);
    }, 10000); // 10 seconds

    console.log(`⏹️  Game ended in room: ${roomCode}`);
    return true;
  }

  /**
   * Remove player from room
   * @param {string} socketId
   * @returns {boolean} Success
   */
  removePlayerFromRoom(socketId) {
    const room = this.getRoomByPlayer(socketId);

    if (!room) {
      return false;
    }

    if (room.host?.socketId === socketId) {
      // Host left, remove entire room
      this.removeRoom(room.code);
    } else if (room.guest?.socketId === socketId) {
      // Guest left
      room.guest = null;
      room.status = 'waiting';
      room.lastActivity = Date.now();
    }

    return true;
  }

  /**
   * Remove room
   * @param {string} roomCode
   * @returns {boolean} Success
   */
  removeRoom(roomCode) {
    const success = this.rooms.delete(roomCode);

    if (success) {
      console.log(`🗑️  Room removed: ${roomCode}`);
    }

    return success;
  }

  /**
   * Add spectator to room
   * @param {string} roomCode
   * @param {string} socketId
   * @param {string} spectatorName
   * @returns {object} { success: boolean, room?: object, error?: string }
   */
  addSpectator(roomCode, socketId, spectatorName) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.status !== 'playing') {
      return { success: false, error: 'Game is not in progress' };
    }

    room.spectators.add({ socketId, name: spectatorName });
    room.lastActivity = Date.now();

    console.log(`👁️  Spectator joined room: ${roomCode}`);

    return { success: true, room };
  }

  /**
   * Remove spectator from room
   * @param {string} roomCode
   * @param {string} socketId
   * @returns {boolean} Success
   */
  removeSpectator(roomCode, socketId) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return false;
    }

    for (const spectator of room.spectators) {
      if (spectator.socketId === socketId) {
        room.spectators.delete(spectator);
        return true;
      }
    }

    return false;
  }

  /**
   * Get active games by type
   * @param {string} gameType - Optional filter by game type
   * @returns {Array} Active games
   */
  getActiveGames(gameType = null) {
    const activeGames = [];

    for (const room of this.rooms.values()) {
      if (room.status === 'playing') {
        if (!gameType || room.gameType === gameType) {
          activeGames.push({
            code: room.code,
            gameType: room.gameType,
            players: [room.host.name, room.guest?.name].filter(Boolean),
            spectators: room.spectators.size,
            isStaked: room.isStaked
          });
        }
      }
    }

    return activeGames;
  }

  /**
   * Generate unique room code
   * @returns {string} Room code
   * @private
   */
  generateRoomCode() {
    return Math.random().toString(36).substring(2, 9).toUpperCase();
  }

  /**
   * Clean up stale rooms
   * @private
   */
  cleanupStaleRooms() {
    const now = Date.now();
    let cleaned = 0;

    for (const [code, room] of this.rooms.entries()) {
      if (now - room.lastActivity > this.ROOM_TIMEOUT) {
        this.rooms.delete(code);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} stale room(s)`);
    }
  }

  /**
   * Mark room as staked
   * @param {string} roomCode
   * @param {boolean} isStaked
   */
  setRoomStaked(roomCode, isStaked = true) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.isStaked = isStaked;
    }
  }
}

module.exports = RoomService;
