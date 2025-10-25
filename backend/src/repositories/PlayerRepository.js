const BaseRepository = require('./BaseRepository');
const Player = require('../models/Player');

class PlayerRepository extends BaseRepository {
  constructor() {
    super(Player);
  }

  async findByName(name) {
    return await this.findOne({ name });
  }

  async findByWalletAddress(walletAddress) {
    return await this.findOne({ walletAddress: walletAddress.toLowerCase() });
  }

  async findOrCreate(name, walletAddress) {
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
      throw new Error(`Error in findOrCreate: ${error.message}`);
    }
  }

  async updateActivity(playerId) {
    return await this.updateById(playerId, { lastActive: new Date() });
  }

  async getActivePlayers(since) {
    return await this.find(
      { lastActive: { $gte: since } },
      { sort: { lastActive: -1 } }
    );
  }
}

module.exports = PlayerRepository;
