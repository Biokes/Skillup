import dotenv from "dotenv";
import { Application } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import SessionService from "../services/SessionService";
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
        // origin: this.FRONTEND_URL,
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

    socket.on('retryQuickMatch', async (dto: QuickMatchDTO) => await this.sessionService.handleRetryQuickMatch(dto, socket));
    socket.on("cancelQuickMatch", async (walletAddress: string) => await this.sessionService.cancelQuickMatch(walletAddress, socket));

    socket.on('joinRoom', async (joinRoomDTO: JoinRoomDTO) => await this.sessionService.joinRoom(joinRoomDTO, socket));
    socket.on('cancelJoinRoom', async (canceProps: { walletAddress: string, roomCode: string }) => await this.sessionService.cancelCreateMatchWithCode(canceProps.walletAddress, socket, canceProps.roomCode));
    socket.on("gameReady", async (data: ReadyGameDTO) => { await this.handleGameReady(socket, data); });
    socket.on("forfeitGame", (data: { gameId: string; playerNumber: number }) => { this.handleForfeit(socket, data) });
    
    socket.on("paddleMove", (data: PaddleMovementDTO) => { this.handlePaddleMove(socket, data); });
    
    socket.on("disconnect", () => { this.handleDisconnect(socket) });
    socket.on("reconnect_attempt", () => { this.handleReconnect(socket)});
    socket.on('validateSession', async (dto: { sessionId: string }, callback) => await this.sessionService.validateSession(dto.sessionId, callback));

    socket.on('checkStakedGame', async (dto: { price: number, walletAddress: string }, callback) => await this.sessionService.checkStakedMatch(dto, callback));
    socket.on('createPaidMatch', async (dto: { gameId: string, paymentTransactionId: string, address: string, stakingPrice: number }, socket) => await this.sessionService.createStakedMatch(dto, socket));

    socket.on('pauseStakedGameConnection', async (dto: { sessionId: string, address: string, stakingPrice: number }) => await this.sessionService.pauseStakeGameConection(dto, socket))
    socket.on('onStakedGameConnection', async (dto: {sessionId:string,address:string,stakingPrice: number, transactionId:string}) => await this.sessionService.onStakedGameConnection(dto, socket))
    socket.on('cancelStakedGameConnection', async (dto: { sessionId: string, address: string, stakingPrice: number }) => await this.sessionService.cancelStakedGame(dto, socket));
    socket.on('joinStakedMatch', async (dto: { gameId:string, paymentTransactionId:string, address: string, stakingPrice: number }, socket:Socket) => await this.sessionService.joinStakedMatch(dto, socket));
  }


  private async handleGameReady(socket: Socket,readyGameData:ReadyGameDTO): Promise<void> {
    const { gameId, playerNumber, sessionId } = readyGameData;
    try {
      this.socketToGameMap.set(socket.id, { gameId, playerNumber });
      socket.join(`game-${gameId}`);
      let gameState = this.pongGameService.getGameState(gameId);
      if (!gameState) {
        const session = await this.sessionService.getSessionById(sessionId);
        if (!session) {
          socket.emit("gameError", { message: "Session not found" });
          return;
        }
        gameState = await this.pongGameService.initializeGame(session, gameId);
      }
      const room = this.server.sockets.adapter.rooms.get(`game-${gameId}`);
      if (room && room.size === 2) {
        const sockets = Array.from(room);
        const socket1 = this.server.sockets.sockets.get(sockets[0] as string);
        const socket2 = this.server.sockets.sockets.get(sockets[1] as string);

        if (socket1 && socket2) {
          this.pongGameService.startGameLoop(gameId);
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
      this.pongGameService.handleDisconnect(gameId, playerNumber);
      this.socketToGameMap.delete(socket.id);
    }
  }

  private handleReconnect(socket: Socket): void {
    const gameInfo = this.socketToGameMap.get(socket.id);
    if (gameInfo) {
      const { gameId, playerNumber } = gameInfo;
      this.pongGameService.handleReconnect(gameId, playerNumber);
    }
  }

  private handleForfeit( socket: Socket, data: { gameId: string; playerNumber: number }): void {
    const { gameId, playerNumber } = data;
    try {
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
