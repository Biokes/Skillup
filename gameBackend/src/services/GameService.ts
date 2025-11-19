import { Server } from "socket.io";
import { GameRepository } from "../data/db/gameRepository";
import { Game } from "../data/entities/models/Game";
import { Session } from "../data/entities/models/Session";
import { GAME_CONSTANTS, GameState } from "../utils";
import { PongPhysics } from "../utils/GamePhysics";

export class GameService {
  private readonly gameRepository: GameRepository;
  private socketServer: Server;
  private activeGames: Map<string, GameState> = new Map();
  private gameLoops: Map<string, NodeJS.Timeout> = new Map();
  private lastFrameTime: Map<string, number> = new Map();

  constructor(socketServer: Server) {
    this.gameRepository = new GameRepository();
    this.socketServer = socketServer;
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
}
