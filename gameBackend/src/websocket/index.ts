
import dotenv from "dotenv";
import { Application } from "express";
import { createServer } from "http";
import { DefaultEventsMap, Server, Socket } from "socket.io";
import PlayerService from "../services/playerService";
import SessionService from "../services/SessionService";
import { CreateGameDTO } from "../data/entities/DTO/CreateGame"
import { JoinRoomDTO } from "../data/entities/DTO/joinRoom";
import { QuickMatchDTO } from "../data/entities/DTO/QuickMatch";
import { Session } from "../data/entities/models/Session";
dotenv.config();

export class WebSocket {
  private FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, "");
  private readonly socketServer;
  private readonly socketConnection;
  private readonly sessionService: SessionService;
  private readonly playerService: PlayerService; 
    
  constructor(app: Application) {
    this.playerService= new PlayerService()  
    this.socketServer = createServer(app);
    this.socketConnection = new Server(this.socketServer, {
      cors: {
        origin: this.FRONTEND_URL,
        methods: ["GET", "POST", "PATCH"],
        credentials: true,
        allowedHeaders: ["*"],
      },
      allowEIO3: true,
      transports: ["websocket"],
      path: "/socket.io/",
      connectTimeout: 45000,
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false,
      allowUpgrades: false,
      perMessageDeflate: false,
    });
    this.socketConnection.engine.on("connection_error", (err) => this.logErrorOnConsole("Socket engine on failed with error: ", err));
    this.socketConnection.on("error", (error) => this.logErrorOnConsole("Socket on failed with error: ", error) );
    this.sessionService = new SessionService();
  }
      
  getSocketServerSetup() {
    return this.socketConnection;
  }
      
  async handleConnection(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    const { walletAddress } = socket.handshake.query;
    if (walletAddress) await this.playerService.findOrCreateProfile(walletAddress as string);
    await this.listenToGameEvents(socket);
  }


  async listenToGameEvents(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    socket.on('createRoom', async (createRoomDto: CreateGameDTO) => await this.sessionService.createGameRoom(createRoomDto));
    socket.on('joinRoom', async (joinRoomDTO: JoinRoomDTO) => await this.sessionService.joinRoom(joinRoomDTO))
    socket.on('quickMatch', async (quickMatchDto:QuickMatchDTO)=> await this.handleQuickMatch(quickMatchDto, socket))
  }

  async handleQuickMatch(quickMatchDTO: QuickMatchDTO, socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) { 
    const session:Session = await this.sessionService.findQuickMatch(quickMatchDTO);
    !!session.player2 ?
      socket.emit('joined', {
        roomCode: session.roomCode,
        status: session.status,
        isStaked: session.isStaked,
        player1: session.player1,
        player2: session.player2,
        amount: session.amount
      })
      :
      socket.emit('waiting', {
        roomCode: session.roomCode,
        status: session.status,
        isStaked: session.isStaked,
        player1: session.player1,
        amount: session.amount
      })
  }

  private logErrorOnConsole(message: string, error: any) {
    console.error(message, error);
  }
}
