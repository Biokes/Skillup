import { Server } from "socket.io";
import { GameRepository } from "../data/repositories/gameRepository";
import { Game } from "../data/models/Game";
import { Session } from "../data/models/Session";
import { GAME_CONSTANTS, GameState, GameUpdatePayload, XP } from "../utils";
import { PongPhysics } from "../utils/GamePhysics";
import { PowerupManager } from "../utils/PowerUpManager";
import PlayerRepository from "../data/repositories/playerRepository";
import { Player } from "../data/models/Player";
import { ChainSkillsException } from "../exceptions";

export class GameService {
  private readonly gameRepository: GameRepository;
  private socketServer: Server;
  private activeGames: Map<string, GameState> = new Map();
  private gameLoops: Map<string, NodeJS.Timeout> = new Map();
  private lastFrameTime: Map<string, number> = new Map();
  private readonly playerRepo: PlayerRepository;  
    
  constructor(socketServer: Server) {
    this.gameRepository = new GameRepository();
    this.socketServer = socketServer;
    this.playerRepo = new PlayerRepository()
  }

  async createGameForSession(session: Session): Promise<Game> {
    return await this.gameRepository.create({ session });
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

  async endGame(gameId: string, winnerAddress: string): Promise<void> {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;

    gameState.status = "ENDED";
    gameState.winner = winnerAddress;

    const winnerPlayer = await this.playerRepo.findOne({where: { walletAddress: winnerAddress }});
    const loserAddress = winnerAddress === gameState.player1.address ? gameState.player2.address : gameState.player1.address;
    const loserPlayer = await this.playerRepo.findOne({ where: { walletAddress: loserAddress } });
    if (winnerPlayer?.stats) {
      winnerPlayer.stats.wins += 1;
      winnerPlayer.stats.gamePlayed += 1;
      winnerPlayer.stats.winStreak += 1;
      if (winnerPlayer.stats.winStreak > winnerPlayer.stats.bestStreak) winnerPlayer.stats.bestStreak = winnerPlayer.stats.winStreak;
      winnerPlayer.stats.rating += XP.WIN;
    }
    if (loserPlayer?.stats) {
        loserPlayer.stats.losses += 1;
        loserPlayer.stats.gamePlayed += 1;
        loserPlayer.stats.winStreak = 0;
        loserPlayer.stats.rating = XP.LOSS;
    }

    await this.playerRepo.save([winnerPlayer!, loserPlayer!]);
    this.stopGameLoop(gameId);

    try {
        const game = await this.gameRepository.findOne({where: { id: gameState.gameId }});
        if (game && winnerPlayer) await this.gameRepository.update(gameState.gameId, { winner: winnerPlayer });
    } catch (error) {
      throw new ChainSkillsException(`Error saving game result: ${(error as Error).message}`);
    }

    this.socketServer.to(`game-${gameId}`).emit("gameOver", { winner: winnerAddress, score1: gameState.player1.score, score2: gameState.player2.score, message: `${winnerAddress} wins!`,});
    this.activeGames.delete(gameId);
    this.lastFrameTime.delete(gameId);
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
    this.socketServer.to(`game-${gameId}`).emit("powerupUsed", {
      playerNumber,
      powerupType,
      activePowerups: { player1: gameState.player1.activePowerup, player2: gameState.player2.activePowerup },
    });
    return true;
  }

  handleDisconnect(gameId: string, playerNumber: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;

    const playerState = playerNumber === 1 ? gameState.player1 : gameState.player2;
    playerState.disconnected = true;
    playerState.disconnectTime = Date.now();

    this.socketServer.to(`game-${gameId}`).emit("opponentDisconnected", {
      playerNumber,
      message: "Opponent disconnected. Waiting for reconnection...",
    });
      
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
    this.socketServer.to(`game-${gameId}`).emit("playerReconnected", {playerNumber,message: "Opponent reconnected!",
    });
  }

  handleForfeit(gameId: string, playerNumber: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState || gameState.status === "ENDED") return;

    const winnerId = playerNumber === 1 ? 2 : 1;
    const winnerAddress =
      winnerId === 1 ? gameState.player1.address : gameState.player2.address;
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
}
