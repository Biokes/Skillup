import { SessionRepository } from './../data/repositories/sessionRepository';
import { Server } from "socket.io";
import { GameRepository } from "../data/repositories/gameRepository";
import { Game } from "../data/models/Game";
import { Session } from "../data/models/Session";
import { GAME_CONSTANTS, GameState, GameUpdatePayload, XP } from "../utils";
import { PongPhysics } from "../utils/GamePhysics";
import { PowerupManager } from "../utils/PowerUpManager";
import PlayerRepository from "../data/repositories/playerRepository";
import { ChainSkillsException } from "../exceptions";
import { Stats } from "../data/models/Stats";
import { Player } from "../data/models/Player";
import { PaymentService } from './paymentService';

export class GameService {
  private readonly gameRepository: GameRepository;
  private socketServer: Server;
  private activeGames: Map<string, GameState> = new Map();
  private gameLoops: Map<string, NodeJS.Timeout> = new Map();
  private lastFrameTime: Map<string, number> = new Map();
  private readonly playerRepo: PlayerRepository; 
  private readonly sessionRepository: SessionRepository;
  private readonly paymentService: PaymentService;

  constructor(socketServer: Server) {
    this.gameRepository = new GameRepository();
    this.socketServer = socketServer;
    this.playerRepo = new PlayerRepository()
    this.sessionRepository = new SessionRepository()
    this.paymentService = new PaymentService()
  }

  async createGameForSession(session: Session,isStaked: boolean): Promise<Game> {
    return await this.gameRepository.create({session, isStaked});
  }

  async initializeGame(session: Session, gameId: string): Promise<GameState> {
    const gameState: GameState = {
      gameId,
      sessionId: session.id,
      player1: {
        address: session.player1 as string,
        paddleY:
          GAME_CONSTANTS.CANVAS_HEIGHT / 2 - GAME_CONSTANTS.PADDLE_HEIGHT / 2,
        score: 0,
        activePowerup: null,
        powerupDuration: 0,
        powerupCooldowns: {},
        shieldActive: false,
        disconnected: false,
      },
      player2: {
        address: session.player2!,
        paddleY:
          GAME_CONSTANTS.CANVAS_HEIGHT / 2 - GAME_CONSTANTS.PADDLE_HEIGHT / 2,
        score: 0,
        activePowerup: null,
        powerupDuration: 0,
        powerupCooldowns: {},
        shieldActive: false,
        disconnected: false,
      },
      ball: PongPhysics.createBall(),
      status: "COUNTDOWN",
      startTime: Date.now(),
    };
    this.activeGames.set(gameId, gameState);
    this.lastFrameTime.set(gameId, Date.now());
    return gameState;
  }

  startGameLoop(gameId: string): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;

    gameState.countdownStartTime = Date.now();
    this.socketServer.to(`game-${gameId}`).emit("gameStart", {
      message: "Game starts in 3 seconds",
      countdown: 3,
    });
      
    setTimeout(() => {
      gameState.status = "PLAYING";
      this.socketServer .to(`game-${gameId}`) .emit("countdownComplete", { message: "Game Started!" });
      const gameLoop = setInterval(() => {
        this.updateGameState(gameId);
      }, GAME_CONSTANTS.GAME_LOOP_INTERVAL_MS);
      this.gameLoops.set(gameId, gameLoop);
    }, GAME_CONSTANTS.COUNTDOWN_DURATION_MS);
  }

  updateGameState(gameId: string): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState || gameState.status === "ENDED") {
      this.stopGameLoop(gameId);
      return;
    }

    if (gameState.status !== "PLAYING") return;

    const now = Date.now();
    const deltaTimeMs = now - (this.lastFrameTime.get(gameId) || now);
    this.lastFrameTime.set(gameId, now);

    PowerupManager.updatePowerups(gameState.player1, deltaTimeMs);
    PowerupManager.updatePowerups(gameState.player2, deltaTimeMs);

    const paddle1Height = PowerupManager.getPaddleHeight(gameState.player1);
    const paddle2Height = PowerupManager.getPaddleHeight(gameState.player2);

    PongPhysics.updateBall(
      gameState.ball,
      gameState.player1.paddleY,
      gameState.player2.paddleY,
      paddle1Height,
      paddle2Height
    );

    const scoreCheck = PongPhysics.checkScoring(gameState.ball);
    if (scoreCheck.scored) {
      this.handleScore(gameId, scoreCheck.scoredBy!);
      return;
    }
    this.broadcastGameUpdate(gameId, paddle1Height, paddle2Height);
  }

  handleScore(gameId: string, scoredBy: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;

    gameState.status = "SCORE_PAUSE";

    if (scoredBy === 1) {
      gameState.player1.score++;
    } else {
      gameState.player2.score++;
    }

    this.socketServer.to(`game-${gameId}`).emit("scoreUpdate", {
      score1: gameState.player1.score,
      score2: gameState.player2.score,
      scoredBy,
    });

    if (gameState.player1.score == GAME_CONSTANTS.WIN_SCORE) {
      this.endGame(gameId, gameState.player1.address);
      return;
    }
    if (gameState.player2.score == GAME_CONSTANTS.WIN_SCORE) {
      this.endGame(gameId, gameState.player2.address);
      return;
    }

    gameState.ball = PongPhysics.resetBall();

    setTimeout(() => {
      if (gameState.status === "SCORE_PAUSE") {
        gameState.status = "PLAYING";
        this.socketServer
          .to(`game-${gameId}`)
          .emit("nextServe", { countdown: 3 });
      }
    }, GAME_CONSTANTS.SCORE_PAUSE_DURATION_MS);
  }

  private async isStakedGame(sessionId: string): Promise<boolean> {
    const sessionFound = await this.sessionRepository.findById(sessionId)
    if (!sessionFound) return false;
    return sessionFound.isStaked;
  }

  async endGame(gameId: string, winnerAddress: string): Promise<void> {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;
    if (!await this.isStakedGame(gameState.sessionId)) {
      await this.endFreeGame(gameState, winnerAddress, gameId);
      return;
    }
    await this.endStakedGame(gameId, winnerAddress, gameState);
  }

  private async endStakedGame(gameId: string, winnerAddress: string, gameState: GameState) { 
    gameState.status = "ENDED";
    gameState.winner = winnerAddress;
    const { cleanWinner, cleanPlayer1, cleanPlayer2 } = this.cleanAddresses(winnerAddress, gameState);
    const { winnerPlayer, loserPlayer } = await this.extractPlayersAndWinnerFromAddresses(cleanWinner, cleanPlayer1, cleanPlayer2);
    this.updatePlayersStats(winnerPlayer, loserPlayer);
    await this.playerRepo.save([winnerPlayer!, loserPlayer!]);
    this.stopGameLoop(gameId);
    this.socketServer.to(`paid-game-${gameId}`).emit("gameOver", { winner: winnerAddress, score1: gameState.player1.score, score2: gameState.player2.score, message: `${winnerAddress} wins!`, });
    try {
      const game = await this.gameRepository.findOne({ where: { id: gameState.gameId } });
      const reciept = await this.paymentService.settleWinner(winnerAddress, game!);
      await this.gameRepository.update(game!.id, {
        isPaid: true,
        paidAt: new Date(),
        isValidForPayment: false,
        paymentTx: reciept
      } )
      this.cleanUpGameAfterEnding(gameId);
      if (game && winnerPlayer) await this.gameRepository.update(gameState.gameId, { winner: winnerPlayer });
    } catch (error) {
      throw new ChainSkillsException(`Error saving game result: ${error instanceof Error ? error: (error as Error).message}`);
    }
  }
  private async endFreeGame(gameState: GameState, winnerAddress: string, gameId: string) {
    gameState.status = "ENDED";
    gameState.winner = winnerAddress;
    const { cleanWinner, cleanPlayer1, cleanPlayer2 } = this.cleanAddresses(winnerAddress, gameState);
    const { winnerPlayer, loserPlayer } = await this.extractPlayersAndWinnerFromAddresses(cleanWinner, cleanPlayer1, cleanPlayer2);
    this.updatePlayersStats(winnerPlayer, loserPlayer);
    await this.playerRepo.save([winnerPlayer!, loserPlayer!]);
    this.stopGameLoop(gameId);
    try {
      const game = await this.gameRepository.findOne({ where: { id: gameState.gameId } });
      if (game && winnerPlayer) await this.gameRepository.update(gameState.gameId, { winner: winnerPlayer });
    } catch (error) {
      throw new ChainSkillsException(`Error saving game result: ${(error as Error).message}`);
    }
    this.socketServer.to(`game-${gameId}`).emit("gameOver", { winner: winnerAddress, score1: gameState.player1.score, score2: gameState.player2.score, message: `${winnerAddress} wins!`, });
    this.cleanUpGameAfterEnding(gameId);
  }

  stopGameLoop(gameId: string): void {
    const loop = this.gameLoops.get(gameId);
    if (loop) {
      clearInterval(loop);
      this.gameLoops.delete(gameId);
    }
  }

  handlePaddleMove(gameId: string, playerNumber: number, position: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;
    const player1PaddleHeight = PowerupManager.getPaddleHeight(gameState.player1);
    const player2PaddleHeight = PowerupManager.getPaddleHeight(gameState.player2)
    const paddleHeight = playerNumber === 1 ? player1PaddleHeight :player2PaddleHeight;
    const validPosition = Math.max( 0, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - paddleHeight, position));
    playerNumber === 1 ? gameState.player1.paddleY = validPosition : gameState.player2.paddleY = validPosition;
  }

  handlePowerup(gameId: string, playerNumber: number, powerupType: string): boolean {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return false;
    const playerState = playerNumber === 1 ? gameState.player1 : gameState.player2;
    if (!PowerupManager.validatePowerup(playerState, powerupType))return false;
    PowerupManager.applyPowerup(playerState, powerupType);
    // Broadcast powerup usage
    this.socketServer.to(`game-${gameId}`).emit("powerupUsed", { playerNumber, powerupType, activePowerups: { player1: gameState.player1.activePowerup, player2: gameState.player2.activePowerup },});
    return true;
  }

  handleDisconnect(gameId: string, playerNumber: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;
    const playerState = playerNumber === 1 ? gameState.player1 : gameState.player2;
    playerState.disconnected = true;
    playerState.disconnectTime = Date.now();
    this.socketServer.to(`game-${gameId}`).emit("opponentDisconnected", { playerNumber, message: "Opponent disconnected. Waiting for reconnection..."});
    setTimeout(() => {
      if (playerState.disconnected) {
        const winnerId = playerNumber === 1 ? 2 : 1;
        const winnerAddress = winnerId === 1 ? gameState.player1.address : gameState.player2.address;
        this.endGame(gameId, winnerAddress);
      }
    }, GAME_CONSTANTS.DISCONNECT_TIMEOUT_MS);
    playerState.disconnectTime = Date.now();
  }

  handleReconnect(gameId: string, playerNumber: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;
    const playerState =  playerNumber === 1 ? gameState.player1 : gameState.player2;
    playerState.disconnected = false;
    this.socketServer.to(`game-${gameId}`).emit("playerReconnected", {playerNumber,message: "Opponent reconnected!",});
  }

  handleForfeit(gameId: string, playerNumber: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState || gameState.status === "ENDED") return;
    const winnerId = playerNumber === 1 ? 2 : 1;
    const winnerAddress = winnerId === 1 ? gameState.player1.address : gameState.player2.address;
    this.endGame(gameId, winnerAddress);
  }

  broadcastGameUpdate(gameId: string, paddle1Height: number, paddle2Height: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;
    const payload: GameUpdatePayload = {
      ballX: gameState.ball.x,
      ballY: gameState.ball.y,
      paddle1Y: gameState.player1.paddleY,
      paddle2Y: gameState.player2.paddleY,
      paddle1Height,
      paddle2Height,
      score1: gameState.player1.score,
      score2: gameState.player2.score,
      activePowerups: {
        player1: gameState.player1.activePowerup,
        player2: gameState.player2.activePowerup,
      },
      status: gameState.status,
    };
    this.socketServer.to(`game-${gameId}`).emit("gameUpdate", payload);
  }

  getGameState(gameId: string) {
    return this.activeGames.get(gameId);
  }

  getActiveGamesCount(): number {
    return this.activeGames.size;
  }

  private async ensurePlayer(walletAddress: string): Promise<Player> {
    let player:Player| null = await this.playerRepo.findOne({ where: { walletAddress },});
    if (!player) {
      player = await this.playerRepo.create({walletAddress,username: "Annonymous" + walletAddress.slice(2, 7),avatarURL: "",stats: this.createDefaultStats(),});
      player = await this.playerRepo.save(player) as Player;
    }
    if (!player.stats) {
      player.stats = this.createDefaultStats();
      player = await this.playerRepo.save(player) as Player;
    }
    return player as Player;
  }

  private createDefaultStats(): Stats {
    const stats = new Stats();
    stats.wins = 0;
    stats.losses = 0;
    stats.gamePlayed = 0;
    stats.winStreak = 0;
    stats.bestStreak = 0;
    stats.rating = 0;
    stats.recentForm = [];
    return stats;
  }
   private cleanUpGameAfterEnding(gameId: string) {
    this.activeGames.delete(gameId);
    this.lastFrameTime.delete(gameId);
  }

  private updatePlayersStats(winnerPlayer: Player, loserPlayer: Player) {
    this.addPlayerStats(winnerPlayer);
    this.subtractPlayerStats(loserPlayer);
  }

  private cleanAddresses(winnerAddress: string, gameState: GameState) {
    const cleanWinner = winnerAddress.toLowerCase();
    const cleanPlayer1 = gameState.player1.address.toLowerCase();
    const cleanPlayer2 = gameState.player2.address.toLowerCase();
    return { cleanWinner, cleanPlayer1, cleanPlayer2 };
  }

  private subtractPlayerStats(loserPlayer: Player) {
    if (loserPlayer?.stats) {
      loserPlayer.stats.losses += 1;
      loserPlayer.stats.gamePlayed += 1;
      loserPlayer.stats.winStreak = 0;
      loserPlayer.stats.rating = XP.LOSS;
      loserPlayer.stats.recentForm.push('L');
    }
  }

  private addPlayerStats(winnerPlayer: Player) {
    if (winnerPlayer?.stats) {
      winnerPlayer.stats.wins += 1;
      winnerPlayer.stats.gamePlayed += 1;
      winnerPlayer.stats.winStreak += 1;
      winnerPlayer.stats.bestStreak = Math.max(winnerPlayer.stats.bestStreak, winnerPlayer.stats.winStreak);
      winnerPlayer.stats.rating += XP.WIN;
      winnerPlayer.stats.recentForm.push('W')
    }
  }
  private async extractPlayersAndWinnerFromAddresses(cleanWinner: string, cleanPlayer1: string, cleanPlayer2: string) {
    const loserAddress = cleanWinner === cleanPlayer1 ? cleanPlayer2 : cleanPlayer1;
    const winnerPlayer = await this.ensurePlayer(cleanWinner);
    const loserPlayer = await this.ensurePlayer(loserAddress);
    return { winnerPlayer, loserPlayer };
  }

}
