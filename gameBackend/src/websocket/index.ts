import { quickMatchSchema } from './../data/entities/DTO/QuickMatch';
import dotenv from "dotenv";
import { Application } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import PlayerService from "../services/playerService";
import SessionService from "../services/SessionService";
import { CreateGameDTO } from "../data/entities/DTO/CreateGame"
import { JoinRoomDTO } from "../data/entities/DTO/joinRoom";
import { QuickMatchDTO } from "../data/entities/DTO/QuickMatch";
import { Session } from "../data/entities/models/Session";
import { ZodError } from 'zod';
dotenv.config();

export class WebSocket {
  private FRONTEND_URL = process.env.FRONTEND_URL;
  private readonly socketServer;
  private readonly socketConnection;
  private readonly sessionService: SessionService;
  private readonly playerService: PlayerService;
    
  constructor(app: Application) {
    this.playerService = new PlayerService()
    this.socketServer = createServer(app);
    this.socketConnection = new Server(this.socketServer, {
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
    this.socketConnection.on("connection", (socket: Socket) => {this.handleConnection(socket)});
    this.socketConnection.engine.on("connection_error", (err) => this.logErrorOnConsole("Socket engine on failed with error: ", err));
    this.socketConnection.on("error", (error) => this.logErrorOnConsole("Socket on failed with error: ", error));
    this.sessionService = new SessionService();
  }
      
  getSocketServerSetup() {
    return this.socketConnection;
  }
  
  getServer() { 
    return this.socketServer;
  }
      
  async handleConnection(socket: Socket) {
    await this.listenToGameEvents(socket);
  }


  async listenToGameEvents(socket: Socket) {
    socket.on('createQuickMatch', async (createRoomDto: CreateGameDTO) => await this.sessionService.createGameRoom(createRoomDto));
    socket.on('joinRoom', async (joinRoomDTO: JoinRoomDTO) => await this.sessionService.joinRoom(joinRoomDTO));
    socket.on('quickMatch', async (quickMatchDto: QuickMatchDTO) => await this.handleQuickMatch(quickMatchDto, socket));
  }

  async handleQuickMatch(quickMatchDTO: QuickMatchDTO, socket: Socket) { 
    let validatedDto;
    try {
      validatedDto = quickMatchSchema.parse(quickMatchDTO);
    } catch (error) { 
      socket.emit('quickMatchError', error instanceof ZodError ? {successful:false,message: error.message}:{successful:false, error} )
      return
    }
    const session: Session = await this.sessionService.findQuickMatch(validatedDto!);
    console.log('finding quick match')
      !!session.player2 ?
        socket.emit('joined', {
          status: session.status,
          isStaked: session.isStaked,
          player1: session.player1,
          player2: session.player2,
          amount: session.amount
        })
        :
        socket.emit('waiting', {
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
