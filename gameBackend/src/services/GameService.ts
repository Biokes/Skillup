import { Server } from "socket.io";
import { GameRepository } from "../data/db/gameRepository";
import { Game } from "../data/entities/models/Game";
import { Session } from "../data/entities/models/Session";
import { GameState } from "../utils";

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
}
