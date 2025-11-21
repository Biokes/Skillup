import dotenv from "dotenv";
import { Application } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import SessionService from "../services/SessionService";
import { CreateGameDTO } from "../data/DTO/CreateGame"
import { JoinRoomDTO } from "../data/DTO/joinRoom";
import { QuickMatchDTO } from "../data/DTO/QuickMatch";
import { ReadyGameDTO } from "../data/DTO/ReadyGame";
import { GameService } from "../services/GameService";
import { PaddleMovementDTO } from "../data/DTO/PaddleMovementDTO";
dotenv.config();


export class WebSocket {
  private FRONTEND_URL = process.env.FRONTEND_URL;
  private readonly socketServer;
  private readonly server: Server;
  private readonly sessionService: SessionService;
  private readonly pongGameService: GameService;
  private socketToGameMap: Map<string, { gameId: string; playerNumber: number }> = new Map();

  constructor(app: Application) {
    this.socketServer = createServer(app);
    this.server = new Server(this.socketServer, {
      cors: {
        origin: this.FRONTEND_URL,
        methods: ["GET", "POST", "PATCH"],
        credentials: true,
        allowedHeaders: ["*"],
      },
      transports: ["websocket", 'polling'],
      path: "/socket.io/",
      connectTimeout: 25000,
      pingInterval: 25000,
      pingTimeout: 25000,
      cookie: false,
      allowUpgrades: false,
      perMessageDeflate: false,
    });
    this.server.on("connection",async (socket: Socket) => {await this.handleConnection(socket)});
    this.server.engine.on("connection_error", (err) => this.logErrorOnConsole("Socket engine on failed with error: ", err));
    this.server.on("error", (error) => this.logErrorOnConsole("Socket on failed with error: ", error));
    this.sessionService = new SessionService(this.server);
    this.pongGameService = new GameService(this.server);
  }
      
  getSocketServerSetup() {
    return this.server;
  }
  
  getServer() { 
    return this.socketServer;
  }
      
  async handleConnection(socket: Socket) {
    await this.listenToGameEvents(socket);
  }


  async listenToGameEvents(socket: Socket) {
    socket.on('quickMatch', async (quickMatchDto: QuickMatchDTO) => await this.sessionService.handleQuickMatch(quickMatchDto, socket));
    socket.on('retryQuickMatch', async (dto: QuickMatchDTO) => await this.sessionService.handleRetryQuickMatch(dto, socket))
    socket.on("cancelQuickMatch", async (walletAddress:string) => await this.sessionService.cancelQuickMatch(walletAddress,socket))
    socket.on('createQuickMatch', async (createRoomDto: CreateGameDTO) => await this.sessionService.createGameRoom(createRoomDto));
    socket.on('joinRoom', async (joinRoomDTO: JoinRoomDTO) => await this.sessionService.joinRoom(joinRoomDTO));

    socket.on("gameReady", async (data: ReadyGameDTO) => { await this.handleGameReady(socket, data);});
    socket.on("paddleMove", (data: PaddleMovementDTO) => { this.handlePaddleMove(socket, data); });
    // socket.on("usePowerup", (data: { playerNumber: number; powerupType: string; gameId: string }) => {this.handlePowerup(socket, data);});
    socket.on("forfeitGame", (data: { gameId: string; playerNumber: number }) => { this.handleForfeit(socket, data); });
    socket.on("disconnect", () => {this.handleDisconnect(socket);});
    socket.on("reconnect_attempt", () => { this.handleReconnect(socket);});
  }

  private async handleGameReady(socket: Socket,readyGameData:ReadyGameDTO): Promise<void> {
    const { gameId, playerNumber, sessionId } = readyGameData;
    try {
      // Store mapping of socket to game
      this.socketToGameMap.set(socket.id, { gameId, playerNumber });
      // Join game room
      socket.join(`game-${gameId}`);
      // console.log("gameId: ",gameId)
      // Initialize game if first player
      let gameState = this.pongGameService.getGameState(gameId);
      if (!gameState) {
        const session = await this.sessionService.getSessionById(sessionId);
        if (!session) {
          socket.emit("gameError", { message: "Session not found" });
          return;
        }
        gameState = await this.pongGameService.initializeGame(session, gameId);
        console.log("gameState: ",gameState)
      }

      // Get both player sockets and start game
      const room = this.server.sockets.adapter.rooms.get(`game-${gameId}`);
      if (room && room.size === 2) {
        const sockets = Array.from(room);
        const socket1 = this.server.sockets.sockets.get(sockets[0] as string);
        const socket2 = this.server.sockets.sockets.get(sockets[1] as string);

        if (socket1 && socket2) {
          // console.log(`🎮 Starting game ${gameId}`);
          this.pongGameService.startGameLoop(gameId,
            // socket1, socket2
          );
        }
      }
    } catch (error) {
      console.error("Error in gameReady:", error);
      socket.emit("gameError", { message: (error as Error).message });
    }
  }

  private handlePaddleMove( socket: Socket, data: PaddleMovementDTO): void {
    const { playerNumber, position, gameId } = data;
    try {
      this.pongGameService.handlePaddleMove(gameId, playerNumber, position);
    } catch (error) {
      console.error("Error handling paddle move:", error);
      socket.emit("error", { message: "Paddle move failed" });
    }
  }

  private handleDisconnect(socket: Socket): void {
    const gameInfo = this.socketToGameMap.get(socket.id);

    if (gameInfo) {
      const { gameId, playerNumber } = gameInfo;
      console.log(`Player ${playerNumber} disconnected from game ${gameId}`);
      this.pongGameService.handleDisconnect(gameId, playerNumber);
      this.socketToGameMap.delete(socket.id);
    }
    console.log(`🔌 Socket ${socket.id} disconnected`);
  }

  private handleReconnect(socket: Socket): void {
    const gameInfo = this.socketToGameMap.get(socket.id);
    if (gameInfo) {
      const { gameId, playerNumber } = gameInfo;
      console.log(`✅ Player ${playerNumber} reconnected to game ${gameId}`);
      this.pongGameService.handleReconnect(gameId, playerNumber);
    }
  }
  private handleForfeit( socket: Socket, data: { gameId: string; playerNumber: number }): void {
    const { gameId, playerNumber } = data;
    try {
      console.log(`🏳️ Player ${playerNumber} forfeited game ${gameId}`);
      this.pongGameService.handleForfeit(gameId, playerNumber);
    } catch (error) {
      console.error("Error handling forfeit:", error);
      socket.emit("error", { message: "Forfeit failed" });
    }
  }
  private logErrorOnConsole(message: string, error: any) {
    console.error(message, error);
  }
}
