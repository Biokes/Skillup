// import { QuickMatchDTO } from '@/src/data/entities/DTO/QuickMatch';
// import { quickMatchSchema } from './../data/entities/DTO/QuickMatch';
import dotenv from "dotenv";
import { Application } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import PlayerService from "../services/playerService";
import SessionService from "../services/SessionService";
import { CreateGameDTO } from "../data/entities/DTO/CreateGame"
import { JoinRoomDTO } from "../data/entities/DTO/joinRoom";
import { QuickMatchDTO } from "../data/entities/DTO/QuickMatch";
// import { Session } from "../data/entities/models/Session";
// import { ZodError } from 'zod';
dotenv.config();

export class WebSocket {
  private FRONTEND_URL = process.env.FRONTEND_URL;
  private readonly socketServer;
  private readonly server: Server;
  private readonly sessionService: SessionService;
  private readonly playerService: PlayerService;
    
  constructor(app: Application) {
    this.playerService = new PlayerService()
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
    this.server.on("connection", (socket: Socket) => {this.handleConnection(socket)});
    this.server.engine.on("connection_error", (err) => this.logErrorOnConsole("Socket engine on failed with error: ", err));
    this.server.on("error", (error) => this.logErrorOnConsole("Socket on failed with error: ", error));
    this.sessionService = new SessionService(this.server);
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
  }

  private logErrorOnConsole(message: string, error: any) {
    console.error(message, error);
  }
}
