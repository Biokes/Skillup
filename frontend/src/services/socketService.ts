import { io, Socket } from "socket.io-client";
import { GameType, Player, GameState, GameResult } from "@/types";
import { toast } from "sonner";

class SocketService {

  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect( walletAddress: string) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL!;
    if (this.socket && this.socket.connected) {
      console.log("⚠️ Socket already connected. Skipping new connection.");
      return;
    }

    if (this.socket) {
      console.log("🧹 Cleaning up old socket before reconnecting...");
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(backendUrl, {
      query: { walletAddress},
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      upgrade: false,
      path: "/socket.io/",
      withCredentials: true,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Connected to backend");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from backend:", reason);
    });

    this.socket.on("error", (data: { message: string }) => {
      console.log("⚠️ Socket error:", data);
      this.emit("error", data.message);
    });
    
    this.setupGameEventListeners();
  }
  private ensureConnected() {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket is not connected. Reconnecting...");
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";
      this.socket = io(backendUrl, {
        transports: ["websocket"],
      });
    }
  }

  private setupGameEventListeners() {
    if (!this.socket) return;

    // this.socket.on("roomCreated", (data: { roomCode: string; room: any }) => {
    //   this.emit("roomCreated", data);
    // });
    // this.socket.on("waitingForOpponent", (data: { roomCode: string }) => {
    //   this.emit("waitingForOpponent", data);
    // });
    // this.socket.on("roomReady", (data: { room: any }) => {
    //   this.emit("roomReady", data);
    // });
    // this.socket.on('joined', (data: Session) => { 
    // })
    // // this.socket.on("gameStart", (gameState: GameState) => {
    // //   this.emit("gameStart", gameState);
    // // });
    // this.socket.on("gameUpdate", (gameState: GameState) => {
    //   this.emit("gameUpdate", gameState);
    // });
    // this.socket.on("gameOver", (result: GameResult) => {
    //   this.emit("gameOver", result);
    // });
    // this.socket.on("gamePaused", (data: { pausesRemaining: number }) => {
    //   this.emit("gamePaused", data);
    // });
    // this.socket.on("gameResumed", () => {
    //   this.emit("gameResumed");
    // });
    // this.socket.on("opponentLeft", () => {
    //   this.emit("opponentLeft");
    // });
    // this.socket.on('waiting', () => {
    //   console.warn("waiting for another player connection to join room")
    // })
    // this.socket.on("opponentDisconnected", () => {
    //   this.emit("opponentDisconnected");
    // });
    
    this.socket.on("quickMatchError", (errorResponse: { message?: string, successful: boolean, error?: Error }) => { 
      toast.error("Please try again, something went wrong");      
      console.error("Quick match error: ", errorResponse)
    })
  
  }
   gameReady(gameId: string, playerNumber: number, sessionId: string) {
    this.ensureConnected();
    this.socket?.emit("gameReady", { gameId, playerNumber, sessionId });
  }

  quickMatch(walletAddress:string, gameType: GameType, isStaked:boolean, amount: number) {
    this.ensureConnected();
    this.socket?.emit("quickMatch", { walletAddress, gameType, isStaked, amount });
  }

  cancelMatch(walletAddress:string) {
    this.ensureConnected();
    this.socket?.emit("cancelQuickMatch", { walletAddress });
  }

  retryQuickMatch(walletAddress:string, gameType: GameType, isStaked:boolean, amount: number) {
    this.ensureConnected();
    this.socket?.emit("retryQuickMatch", { walletAddress, gameType, isStaked, amount });
  }

  paddleMove(playerNumber: number, position: number, gameId: string) {
    this.ensureConnected();
    this.socket?.emit("paddleMove", { playerNumber, position, gameId });
  }
 
  forfeitGame() {
    this.socket?.emit("forfeitGame");
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    // Setup actual socket.io listener if socket exists
    if (this.socket) {
      this.socket.off(event); // Remove old listeners to avoid duplicates
      this.socket.on(event, (data) => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          callbacks.forEach((cb) => cb(data));
        }
      });
    }
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  getSocket() {
    this.ensureConnected()
    return this.socket;
  }
  
}

export const socketService = new SocketService();
