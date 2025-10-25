const GameRepository = require('../repositories/GameRepository');
const signatureService = require('./SignatureService');

class PaymentService {
  constructor() {
    this.gameRepo = new GameRepository();
  }

  /**
   * Create or update staked game record
   * @param {object} gameData - Game and stake data
   * @returns {Promise<object>} Game record
   */
  async createStakedGame(gameData) {
    const {
      roomCode,
      gameType,
      player1,
      stakeAmount,
      player1Address,
      player1TxHash
    } = gameData;

    try {
      let game = await this.gameRepo.findByRoomCode(roomCode);

      if (game) {
        throw new Error('Game with this room code already exists');
      }

      game = await this.gameRepo.create({
        roomCode,
        gameType,
        player1: {
          name: player1.name,
          rating: player1.rating,
          walletAddress: player1Address.toLowerCase()
        },
        isStaked: true,
        stakeAmount,
        player1Address: player1Address.toLowerCase(),
        player1TxHash,
        status: 'waiting'
      });

      console.log(`✅ Staked game created: ${roomCode} - ${stakeAmount} ETH`);
      return game;
    } catch (error) {
      throw new Error(`Failed to create staked game: ${error.message}`);
    }
  }

  /**
   * Complete player 2 stake
   * @param {string} roomCode
   * @param {object} player2Data
   * @returns {Promise<object>} Updated game record
   */
  async completePlayer2Stake(roomCode, player2Data) {
    const { player2, player2Address, player2TxHash } = player2Data;

    try {
      const game = await this.gameRepo.findByRoomCode(roomCode);

      if (!game) {
        throw new Error('Game not found');
      }

      if (!game.isStaked) {
        throw new Error('Game is not a staked match');
      }

      if (game.player2TxHash) {
        throw new Error('Player 2 has already staked');
      }

      const updatedGame = await this.gameRepo.update(
        { roomCode },
        {
          player2: {
            name: player2.name,
            rating: player2.rating,
            walletAddress: player2Address.toLowerCase()
          },
          player2Address: player2Address.toLowerCase(),
          player2TxHash,
          status: 'playing'
        }
      );

      console.log(`✅ Player 2 stake completed: ${roomCode}`);
      return updatedGame;
    } catch (error) {
      throw new Error(`Failed to complete player 2 stake: ${error.message}`);
    }
  }

  /**
   * Finalize game and generate winner signature
   * @param {string} roomCode
   * @param {string} winner - 'player1' or 'player2'
   * @param {object} score - Game score
   * @returns {Promise<object>} Updated game with signature
   */
  async finalizeGame(roomCode, winner, score) {
    try {
      const game = await this.gameRepo.findByRoomCode(roomCode);

      if (!game) {
        throw new Error('Game not found');
      }

      const winnerAddress = winner === 'player1' ? game.player1Address : game.player2Address;

      let winnerSignature = null;

      // Generate signature if game is staked
      if (game.isStaked && winnerAddress) {
        if (signatureService.isReady()) {
          try {
            winnerSignature = await signatureService.signWinner(
              roomCode,
              winnerAddress,
              game.stakeAmount
            );
            console.log(`✅ Winner signature generated for ${roomCode}`);
          } catch (error) {
            console.error(`❌ Failed to generate signature: ${error.message}`);
            // Continue without signature
          }
        } else {
          console.warn('⚠️  Signature service not ready');
        }
      }

      const updatedGame = await this.gameRepo.update(
        { roomCode },
        {
          winner,
          score,
          winnerAddress,
          winnerSignature,
          status: 'finished',
          endedAt: new Date()
        }
      );

      return updatedGame;
    } catch (error) {
      throw new Error(`Failed to finalize game: ${error.message}`);
    }
  }

  /**
   * Get unclaimed wins for a wallet address
   * @param {string} walletAddress
   * @returns {Promise<Array>} Unclaimed games
   */
  async getUnclaimedWins(walletAddress) {
    try {
      return await this.gameRepo.findUnclaimedWins(walletAddress);
    } catch (error) {
      throw new Error(`Failed to get unclaimed wins: ${error.message}`);
    }
  }

  /**
   * Mark game as claimed
   * @param {string} gameId
   * @param {string} claimTxHash
   * @returns {Promise<object>} Updated game
   */
  async markAsClaimed(gameId, claimTxHash) {
    try {
      const game = await this.gameRepo.model.findById(gameId);

      if (!game) {
        throw new Error('Game not found');
      }

      if (game.claimed) {
        throw new Error('Prize already claimed');
      }

      await game.markAsClaimed(claimTxHash);

      console.log(`✅ Game ${gameId} marked as claimed`);
      return game;
    } catch (error) {
      throw new Error(`Failed to mark game as claimed: ${error.message}`);
    }
  }

  /**
   * Verify stake transaction (placeholder for future blockchain verification)
   * @param {string} txHash
   * @param {string} expectedAmount
   * @returns {Promise<boolean>}
   */
  async verifyStakeTransaction(txHash, expectedAmount) {
    // TODO: Implement blockchain verification
    // For now, assume all transactions are valid
    console.log(`⚠️  Transaction verification not implemented: ${txHash}`);
    return true;
  }

  /**
   * Get signer address
   * @returns {string|null}
   */
  getSignerAddress() {
    return signatureService.getSignerAddress();
  }
}

module.exports = PaymentService;
