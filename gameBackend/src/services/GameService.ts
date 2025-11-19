import {
    Server,
    // Socket
} from "socket.io";
import { GameRepository } from "../data/db/gameRepository";
import { Game } from "../data/entities/models/Game";
import { Session } from "../data/entities/models/Session";
import { GAME_CONSTANTS, GameState, GameUpdatePayload } from "../utils";
import { PongPhysics } from "../utils/GamePhysics";
import { PowerupManager } from "../utils/PowerUpManager";
import PlayerRepository from "../data/db/playerRepository";
import { Player } from "../data/entities/models/Player";
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

    startGameLoop(gameId: string,
        // socket1: Socket, socket2: Socket
    ): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;

    // Emit countdown
    gameState.countdownStartTime = Date.now();
    this.socketServer.to(`game-${gameId}`).emit("gameStart", {
      message: "Game starts in 3 seconds",
      countdown: 3,
    });

    // Wait for countdown, then start game loop
    setTimeout(() => {
      gameState.status = "PLAYING";
      this.socketServer
        .to(`game-${gameId}`)
        .emit("countdownComplete", { message: "Game Started!" });

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

    // Update powerups
    PowerupManager.updatePowerups(gameState.player1, deltaTimeMs);
    PowerupManager.updatePowerups(gameState.player2, deltaTimeMs);

    // Get paddle heights based on active powerups
    const paddle1Height = PowerupManager.getPaddleHeight(gameState.player1);
    const paddle2Height = PowerupManager.getPaddleHeight(gameState.player2);

    // Update ball physics
    PongPhysics.updateBall(
      gameState.ball,
      gameState.player1.paddleY,
      gameState.player2.paddleY,
      paddle1Height,
      paddle2Height
    );

    // Check for scoring
    const scoreCheck = PongPhysics.checkScoring(gameState.ball);
    if (scoreCheck.scored) {
      this.handleScore(gameId, scoreCheck.scoredBy!);
      return;
    }

    // Broadcast game update
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

    // Emit score update
    this.socketServer.to(`game-${gameId}`).emit("scoreUpdate", {
      score1: gameState.player1.score,
      score2: gameState.player2.score,
      scoredBy,
    });

    // Check win condition
    if (gameState.player1.score >= GAME_CONSTANTS.WIN_SCORE) {
      this.endGame(gameId, gameState.player1.address);
      return;
    }
    if (gameState.player2.score >= GAME_CONSTANTS.WIN_SCORE) {
      this.endGame(gameId, gameState.player2.address);
      return;
    }

    // Reset ball and wait for next serve
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
    const gameWinner = await this.playerRepo.findOne({ where: {walletAddress: gameState.winner}})
    this.stopGameLoop(gameId);
      
    try {
      const game = await this.gameRepository.findOne({where: { id: gameState.gameId }});
      if (game && game.session) await this.gameRepository.update(gameState.gameId, { winner: gameWinner as Player });
    } catch (error) {
      throw new ChainSkillsException(`Error saving game result: ${(error as Error).message}`);
    }

    // Emit game over
    this.socketServer.to(`game-${gameId}`).emit("gameOver", {
      winner: winnerAddress,
      score1: gameState.player1.score,
      score2: gameState.player2.score,
      message: `${winnerAddress} wins!`,
    });

    // Cleanup
    setTimeout(() => {
      this.activeGames.delete(gameId);
      this.lastFrameTime.delete(gameId);
    }, 5000);
  }

  stopGameLoop(gameId: string): void {
    const loop = this.gameLoops.get(gameId);
    if (loop) {
      clearInterval(loop);
      this.gameLoops.delete(gameId);
    }
  }

  // ============ PLAYER INPUT ============
  handlePaddleMove(gameId: string, playerNumber: number, position: number): void {
    const gameState = this.activeGames.get(gameId);
    if (!gameState) return;
    const paddleHeight = playerNumber === 1 ? PowerupManager.getPaddleHeight(gameState.player1) : PowerupManager.getPaddleHeight(gameState.player2);
    const validPosition = Math.max( 0, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - paddleHeight, position));
    playerNumber === 1 ? gameState.player1.paddleY = validPosition :  gameState.player2.paddleY = validPosition;
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

  // ============ DISCONNECT HANDLING ============
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
      
    // Wait 5 seconds for reconnection
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

  getGameState(gameId: string): GameState {
    if(!this.activeGames.get(gameId)) throw new ChainSkillsException(`invalid gameId ${gameId}`);
    return this.activeGames.get(gameId) as GameState;
  }

  getActiveGamesCount(): number {
    return this.activeGames.size;
  }
}
