// const { calculateRatingChanges } = require('../../utils/eloCalculator');
import { GAME_TYPES, IGame } from "../data/models/types.js";
import { GameRepository } from "../data/repositories/GameRepository.js";
import { PlayerRepository } from "../data/repositories/PlayerRepository.js";
import { ChainSkillsException } from "../exceptions/index.js";

export abstract class BaseGameService {
    
    protected gameType: GAME_TYPES;
    protected readonly gameRepository: GameRepository;
    protected readonly playerRepository: PlayerRepository;

    constructor(gameType: GAME_TYPES, gameRepository: GameRepository, playerRepository: PlayerRepository) {
      this.gameType = gameType;
      this.gameRepository = gameRepository;
      this.playerRepository = playerRepository;
    }

    async createGame(roomCode: string, player1Address: string, stakeAmount: number, player1TxHash: string): Promise<IGame>{ 
      const player1 = await this.playerRepository.findByWalletAddress(player1Address);
      if (!player1) throw new ChainSkillsException("Player with provided wallet Adddress does not exist \nBaseGame.ts:24");
      return await this.gameRepository.create({
        roomCode: roomCode,
        stakeAmount: stakeAmount,
        gameType: this.gameType,
        player1TxHash: stakeAmount > 0 ? player1TxHash as string : '',
        player1Address: player1Address,
        winner: null,
        scoreAndPauses: {
          "player1Score": 0,
          "player2Score": 0,
          "player1Pauses": 0,
          "player2Pauses":0
        },
        claimed: false,
        status: "waiting",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  
    async getGameByRoomCode(roomCode: string):Promise<IGame>{
      const gameFound = await this.gameRepository.findByRoomCode(roomCode);
      if (gameFound) return gameFound;
      throw new ChainSkillsException(`Game with ${roomCode} not found`);
    }
  
    async endGame(roomCode:string, winner: "player1" | "player2" | null,  winnerAddress?: string): Promise<IGame| null>{
      const updateData: any = { 
          status: "finished",
          winner,
          endedAt: new Date()
        };
      if (winnerAddress) {
        updateData.winnerAddress = winnerAddress.toLowerCase();
      }
      return await this.gameRepository.update({ roomCode }, updateData)
    }
  
    async getGamesByPlayerWalletAddress(playerWalletAddress: string): Promise<IGame[]>{
      return await this.gameRepository.findPlayerGames(playerWalletAddress, this.gameType, null);
    }
  
    abstract updateGameState(roomCode: string): Promise<IGame>;
  
    abstract checkGameOver(roomCode: string): Promise<boolean>;
  
    abstract pauseGame(roomCode: string, socketID: string): Promise<void>;
    abstract resumeGame(roomCode: string): Promise<void>;
  // pauseGame(roomCode, socketId, resumeCallback) {
  //   const game = this.activeGames.get(roomCode);
  //   if (!game) {
  //     return { success: false, message: 'Game not found' };
  //   }

  //   if (game.isPaused) {
  //     return { success: false, message: 'Game is already paused' };
  //   }

  //   const player = game.players.find(p => p.socketId === socketId);
  //   if (!player) {
  //     return { success: false, message: 'Player not found' };
  //   }

  //   const MAX_PAUSES_PER_PLAYER = 2;
  //   if (player.pausesUsed >= MAX_PAUSES_PER_PLAYER) {
  //     return { success: false, message: 'You have no pauses remaining' };
  //   }

  //   game.isPaused = true;
  //   player.pausesUsed += 1;
  //   game.pauseCount += 1;

  //   if (game.pauseTimerId) {
  //     clearTimeout(game.pauseTimerId);
  //   }

  //   game.pauseTimerId = setTimeout(() => {
  //     if (game.isPaused) {
  //       game.isPaused = false;
  //       game.pauseTimerId = null;
  //       if (resumeCallback) {
  //         resumeCallback(roomCode);
  //       }
  //     }
  //   }, 10000);

  //   return {
  //     success: true,
  //     pausesRemaining: MAX_PAUSES_PER_PLAYER - player.pausesUsed,
  //     playerName: player.name
  //   };
  // }

//   resumeGame(roomCode) {
//     const game = this.activeGames.get(roomCode);
//     if (!game) return false;

//     if (game.pauseTimerId) {
//       clearTimeout(game.pauseTimerId);
//       game.pauseTimerId = null;
//     }

//     game.isPaused = false;
//     return true;
//   }



//   calculateRatings(winner, loser, isDraw = false) {
//     return calculateRatingChanges(winner.rating, loser.rating, isDraw);
//   }

//   validateMove(gameState, socketId, moveData) {
//     return true;
//   }
// }
}