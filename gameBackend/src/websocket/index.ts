import dotenv from "dotenv";
import { Application } from "express";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

export class WebSocket {
  private FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, "");
  private readonly socketServer;
  private readonly socketConnection;
  constructor(app: Application) {
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
    this.socketConnection.engine.on('connection_error', (err) =>this.logErrorOnConsole("Socket engine on failed with error: ", err))
    this.socketConnection.on('error', (error) =>this.logErrorOnConsole("Socket on failed with error: ", error))
  }
    getSocketServerSetup() {
        return this.socketConnection
     }
    private logErrorOnConsole(message:string,error: any){
        console.error(message,error);
    }
}
